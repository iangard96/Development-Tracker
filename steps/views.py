# steps/views.py
from django.db import connection, transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import DevelopmentStep, Project, ProjectContact
from .serializers import (
    DevelopmentStepSerializer,
    ProjectSerializer,
    ProjectContactSerializer,
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


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("id")
    serializer_class = ProjectSerializer
    
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
