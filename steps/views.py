# steps/views.py
import csv
from datetime import datetime
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.db import connection, transaction
from django.db.models import OuterRef, Subquery
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import generics

from .models import (
    DevelopmentStep,
    Project,
    ProjectContact,
    ProjectEconomics,
    ProjectIncentives,
    StepOrder,
)
from .serializers import (
    DevelopmentStepSerializer,
    ProjectSerializer,
    ProjectContactSerializer,
    ProjectEconomicsSerializer,
    ProjectIncentivesSerializer,
)


class DevelopmentStepViewSet(viewsets.ModelViewSet):
    queryset = DevelopmentStep.objects.all().order_by("id")
    serializer_class = DevelopmentStepSerializer
    filterset_fields = ["project"]  # /development-steps/?project=<id>

    def get_queryset(self):
        qs = super().get_queryset()
        # Check both "project" and "project_id" query params for flexibility
        project_id = self.request.query_params.get("project") or self.request.query_params.get("project_id")
        if project_id:
            qs = qs.filter(project_id=project_id)
        order_subq = StepOrder.objects.filter(
            project_id=OuterRef("project_id"),
            step_id=OuterRef("pk"),
        ).values("sequence")[:1]
        qs = qs.annotate(sequence=Subquery(order_subq))
        return qs.order_by("sequence", "id")
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def reorder(self, request):
        """
        Reorder steps for a project.
        Body: { "project": <id>, "order": [stepId1, stepId2, ...] }
        """
        project_id = request.data.get("project")
        order = request.data.get("order", [])
        if not project_id or not isinstance(order, list) or len(order) == 0:
            return Response({"detail": "project and order[] required"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate project
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({"detail": "project not found"}, status=status.HTTP_404_NOT_FOUND)

        # Ensure all steps belong to project
        step_ids = [int(s) for s in order if isinstance(s, (int, str))]
        count = DevelopmentStep.objects.filter(pk__in=step_ids, project_id=project_id).count()
        if count != len(step_ids):
            return Response({"detail": "order contains steps not in project"}, status=status.HTTP_400_BAD_REQUEST)

        # Apply sequence
        seq = 1
        for sid in step_ids:
            StepOrder.objects.update_or_create(
                project=project,
                step_id=sid,
                defaults={"sequence": seq},
            )
            seq += 1

        return Response({"detail": "ok"}, status=status.HTTP_200_OK)


class ProjectEconomicsView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectEconomicsSerializer
    lookup_url_kwarg = "project_id"

    def get_object(self):
        project_id = self.kwargs.get(self.lookup_url_kwarg)
        project = generics.get_object_or_404(Project, pk=project_id)
        obj, _ = ProjectEconomics.objects.get_or_create(project=project)
        return obj


class ProjectIncentivesView(generics.RetrieveUpdateAPIView):
    serializer_class = ProjectIncentivesSerializer
    lookup_url_kwarg = "project_id"

    def get_object(self):
        project_id = self.kwargs.get(self.lookup_url_kwarg)
        project = generics.get_object_or_404(Project, pk=project_id)
        obj, _ = ProjectIncentives.objects.get_or_create(project=project)
        return obj


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("id")
    serializer_class = ProjectSerializer

    CSV_TEMPLATES = {
        "BTM Rooftop": "BTM Rooftop.csv",
        "BTM Ground": "BTM Ground.csv",
        "FTM Rooftop Community Solar": "FTM Rooftop Community Solar.csv",
        "FTM Ground Community Solar": "FTM Ground Community Solar.csv",
    }

    def _phase_to_int(self, value: str | None):
        if value is None:
            return None
        lookup = {
            "1": 1,
            "pre dev": 1,
            "early": 1,
            "2": 2,
            "dev": 2,
            "mid": 2,
            "3": 3,
            "pre con": 3,
            "late": 3,
        }
        key = str(value).strip().lower()
        return lookup.get(key, None)

    def _to_decimal(self, raw: str | None):
        if raw is None:
            return None
        val = str(raw).replace(",", "").strip()
        if val == "":
            return None
        try:
            return Decimal(val)
        except Exception:
            return None

    def _to_date(self, raw: str | None):
        if raw is None:
            return None
        val = str(raw).strip()
        if val == "":
            return None
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
            try:
                return datetime.strptime(val, fmt).date()
            except Exception:
                continue
        try:
            dt = datetime.fromisoformat(val)
            return dt.date()
        except Exception:
            return None

    def _to_int(self, raw: str | None):
        if raw is None:
            return None
        val = str(raw).strip()
        if val == "":
            return None
        try:
            return int(val)
        except Exception:
            return None

    def _normalize_dev_type(self, raw: str | None):
        if not raw:
            return None
        key = str(raw).strip().lower()
        mapping = {
            "permitting / compliance": "Permitting",
            "permitting": "Permitting",
            "due diligence": "Due Diligence",
            "interconnection": "Interconnection",
            "site control": "Site Control",
            "engineering": "Engineering",
            "financing": "Financing",
            "construction / execution": "Construction / Execution",
        }
        return mapping.get(key, raw)

    def _flag_value(self, raw: str | None):
        if raw is None:
            return None
        val = str(raw).strip().lower()
        if val in {"x", "yes", "y", "1", "true"}:
            return "X"
        if val == "n/a":
            return "N/A"
        if val == "n":
            return "N"
        return raw

    def _derive_requirement_tags(self, row: dict):
        tags: list[str] = []
        if self._flag_value(row.get("Site Control")) == "X":
            tags.append("Site Control")
        if self._flag_value(row.get("Engineering")) == "X":
            tags.append("Engineering")
        if self._flag_value(row.get("Interconnection")) == "X":
            tags.append("Interconnection")
        if self._flag_value(row.get("Permitting / Compliance")) == "X":
            tags.append("Permitting/Compliance")
        if self._flag_value(row.get("Financing")) == "X":
            tags.append("Financing")
        if self._flag_value(row.get("Construction / Execution")) == "X":
            tags.append("Construction/Execution")
        return tags

    def _bootstrap_from_csv(self, project: Project) -> list[int]:
        """
        Load default activities for a project type from CSV (if present).
        Returns list of new step IDs or empty if no CSV match.
        """
        template_name = self.CSV_TEMPLATES.get(project.project_type or "")
        if not template_name:
            return []

        csv_path = Path(settings.BASE_DIR) / template_name
        if not csv_path.exists():
            return []

        inserted_ids: list[int] = []

        with connection.cursor() as cur, open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                return []

            # ensure serial is aligned
            cur.execute(
                '''
                SELECT setval(
                    pg_get_serial_sequence('"app"."DevTracker"', 'id'),
                    COALESCE((SELECT MAX(id) FROM "app"."DevTracker"), 1)
                );
                '''
            )

            for idx, row in enumerate(reader, start=1):
                tags = self._derive_requirement_tags(row)
                requirement_val = ", ".join(tags) if tags else None

                cols = [
                    ("risk_heatmap", (row.get("Risk Heatmap") or "").strip() or None),
                    ('"Development Steps"', (row.get("Activity") or "").strip() or f"Activity {idx}"),
                    ("phase", self._phase_to_int(row.get("Phase"))),
                    ("start_date", self._to_date(row.get("Start Date"))),
                    ("end_date", self._to_date(row.get("End Date"))),
                    ("status", (row.get("Status") or "").strip() or None),
                    ("dev_type", self._normalize_dev_type(row.get("Dev Type"))),
                    ("planned_spend", self._to_decimal(row.get("Planned Spend ($)"))),
                    ("actual_spend", self._to_decimal(row.get("Actual Spend ($)"))),
                    ("agency", (row.get("Agency") or "").strip() or None),
                    ("owner", (row.get("Owner") or "").strip() or None),
                    ("responsible_party", (row.get("Responsible Party") or "").strip() or None),
                    ("responsible_individual", (row.get("Responsible Individual") or "").strip() or None),
                    ("process", (row.get("Process") or "").strip() or None),
                    ("link", (row.get("Link") or "").strip() or None),
                    ("requirement", requirement_val),
                    ("site_control_flag", self._flag_value(row.get("Site Control"))),
                    ("engineering_flag", self._flag_value(row.get("Engineering"))),
                    ("interconnection_flag", self._flag_value(row.get("Interconnection"))),
                    ("permitting_compliance_flag", self._flag_value(row.get("Permitting / Compliance"))),
                    ("financing_flag", self._flag_value(row.get("Financing"))),
                    ("construction_execution_flag", self._flag_value(row.get("Construction / Execution"))),
                    ("storage_hybrid_impact", (row.get("Storage Hybrid Impact") or "").strip() or None),
                    ("milestones_ntp_gates", (row.get("Milestones / NTP Gates") or "").strip() or None),
                    ("purpose_related_activity", self._to_int(row.get("Purpose / Related Activity"))),
                    ("project_id", project.id),
                ]

                col_names = [c for c, _ in cols]
                placeholders = ["%s"] * len(cols)
                values = [v for _, v in cols]

                cur.execute(
                    f'''
                    INSERT INTO "app"."DevTracker" ({", ".join(col_names)})
                    VALUES ({", ".join(placeholders)})
                    RETURNING id;
                    ''',
                    values,
                )
                new_id = cur.fetchone()[0]
                inserted_ids.append(new_id)

                order_value = row.get("Order")
                try:
                    seq_value = int(order_value) if order_value not in (None, "") else idx
                except Exception:
                    seq_value = idx
                StepOrder.objects.update_or_create(
                    project=project,
                    step_id=new_id,
                    defaults={"sequence": seq_value},
                )

        return inserted_ids
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def bootstrap_steps(self, request, pk=None):
        """
        Ensure this project has a set of DevelopmentStep rows.

        1) If steps already exist for this project → just return them.
        2) Else, try 'template' steps where project_id IS NULL.
        3) Else, use the first other project's steps as a template.

        New rows copy name/phase/development_type only; dates/spend/status blank.

        NOTE:
        - We do NOT insert into 'id' (identity, GENERATED ALWAYS).
        - We do NOT insert into 'duration_days' (generated column).
        """
        project = self.get_object()

        # 1) Already has steps?
        existing = DevelopmentStep.objects.filter(project_id=project.id).order_by("id")
        if existing.exists():
            ser = DevelopmentStepSerializer(existing, many=True)
            return Response(ser.data, status=status.HTTP_200_OK)

        # 1b) Try CSV template for the new project types
        try:
            inserted = self._bootstrap_from_csv(project)
            if inserted:
                fresh = DevelopmentStep.objects.filter(project_id=project.id).order_by("id")
                ser = DevelopmentStepSerializer(fresh, many=True)
                return Response(ser.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("CSV bootstrap failed:", repr(e))

        try:
            with connection.cursor() as cur:
                # --- IMPORTANT: sync the identity sequence with current max(id) ---
                cur.execute(
                    '''
                    SELECT setval(
                        pg_get_serial_sequence('"app"."DevTracker"', 'id'),
                        COALESCE((SELECT MAX(id) FROM "app"."DevTracker"), 1)
                    );
                    '''
                )

                # Any template rows with project_id IS NULL?
                cur.execute(
                    'SELECT COUNT(*) FROM "app"."DevTracker" WHERE project_id IS NULL;'
                )
                template_count = cur.fetchone()[0]

                if template_count > 0:
                    # 2) Clone rows where project_id IS NULL
                    cur.execute(
                        '''
                        WITH src AS (
                            SELECT
                                t."Development Steps",
                                t.phase,
                                t.dev_type
                            FROM "app"."DevTracker" t
                            WHERE t.project_id IS NULL
                            ORDER BY t.id
                        )
                        INSERT INTO "app"."DevTracker"
                        (
                            "Development Steps",
                            phase,
                            start_date,
                            end_date,
                            status,
                            dev_type,
                            planned_spend,
                            actual_spend,
                            project_id
                        )
                        SELECT
                            src."Development Steps" AS "Development Steps",
                            src.phase               AS phase,
                            NULL                    AS start_date,
                            NULL                    AS end_date,
                            NULL                    AS status,
                            src.dev_type            AS dev_type,
                            NULL                    AS planned_spend,
                            NULL                    AS actual_spend,
                            %s                      AS project_id
                        FROM src;
                        ''',
                        [project.id],
                    )
                else:
                    # 3) Fallback: use the first OTHER project's steps as template
                    base = (
                        DevelopmentStep.objects.exclude(project__isnull=True)
                        .order_by("project_id", "id")
                        .first()
                    )
                    if base is None:
                        # Nothing to clone from → return empty list
                        return Response([], status=status.HTTP_200_OK)

                    base_project_id = base.project_id

                    cur.execute(
                        '''
                        WITH src AS (
                            SELECT
                                t."Development Steps",
                                t.phase,
                                t.dev_type
                            FROM "app"."DevTracker" t
                            WHERE t.project_id = %s
                            ORDER BY t.id
                        )
                        INSERT INTO "app"."DevTracker"
                        (
                            "Development Steps",
                            phase,
                            start_date,
                            end_date,
                            status,
                            dev_type,
                            planned_spend,
                            actual_spend,
                            project_id
                        )
                        SELECT
                            src."Development Steps" AS "Development Steps",
                            src.phase               AS phase,
                            NULL                    AS start_date,
                            NULL                    AS end_date,
                            NULL                    AS status,
                            src.dev_type            AS dev_type,
                            NULL                    AS planned_spend,
                            NULL                    AS actual_spend,
                            %s                      AS project_id
                        FROM src;
                        ''',
                        [base_project_id, project.id],
                    )

        except Exception as e:
            print("ERROR in bootstrap_steps:", repr(e))
            return Response(
                {"detail": f"bootstrap_steps failed: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Reload fresh rows for this project and return them
        fresh = DevelopmentStep.objects.filter(project_id=project.id).order_by("id")
        ser = DevelopmentStepSerializer(fresh, many=True)
        return Response(ser.data, status=status.HTTP_201_CREATED)


class ProjectContactViewSet(viewsets.ModelViewSet):
    queryset = ProjectContact.objects.all().order_by("id")
    serializer_class = ProjectContactSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = self.request.query_params.get("project_id")
        if project_id:
            qs = qs.filter(project_id=project_id)
        return qs.order_by("id")
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
