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
from rest_framework.views import APIView
from typing import Any, Dict, List, Optional

from .models import (
    DevelopmentStep,
    Project,
    ProjectContact,
    ProjectEconomics,
    ProjectIncentives,
    StepOrder,
    ProjectFinanceRun,
    PermitRequirement,
)
from .serializers import (
    DevelopmentStepSerializer,
    ProjectSerializer,
    ProjectContactSerializer,
    ProjectEconomicsSerializer,
    ProjectIncentivesSerializer,
    ProjectFinanceRunSerializer,
    PermitRequirementSerializer,
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


class ProjectFinanceRunView(APIView):
    """
    Synchronous financial model run endpoint.
    Accepts inputs, runs a placeholder calc, stores inputs/outputs, and returns the run.
    """

    serializer_class = ProjectFinanceRunSerializer

    def post(self, request, project_id):
        project = generics.get_object_or_404(Project, pk=project_id)
        payload: Dict[str, Any] = request.data or {}

        def _num(val: Any, default: Decimal | int | float = 0) -> Decimal:
            if val in (None, ""):
                return Decimal(default)
            try:
                return Decimal(str(val))
            except Exception:
                return Decimal(default)

        def _from_group(group: Dict[str, Any], key: str, default: Decimal | int | float = 0) -> Decimal:
            return _num(group.get(key), default)

        incentives = getattr(project, "incentives", None)
        economics = getattr(project, "economics", None)
        system = payload.get("system", {}) or {}
        production = payload.get("production", {}) or {}
        revenue = payload.get("revenue", {}) or {}
        opex = payload.get("opex", {}) or {}
        lease = payload.get("land_lease", {}) or payload.get("lease", {}) or {}
        debt = payload.get("debt", {}) or {}
        tax = payload.get("tax", {}) or {}
        inc = payload.get("incentives", {}) or {}
        analysis = payload.get("analysis", {}) or {}

        capacity_kw = float(_from_group(system, "dc_kw", system.get("capacity_kw", 1000)))
        capex_per_w = float(_from_group(system, "capex_per_w", system.get("capexPerW", 1.75)))
        total_capex = float(_from_group(system, "total_capex", 0))
        if total_capex <= 0:
            total_capex = capex_per_w * capacity_kw * 1000

        # Revenue inputs
        ppa_price = float(_from_group(revenue, "ppa_price_mwh", revenue.get("ppaPrice", 55)))
        ppa_escalator = float(_from_group(revenue, "ppa_escalator_pct", revenue.get("ppaEscPct", 2)))
        rec_price = float(_from_group(revenue, "rec_price_mwh", revenue.get("recPrice", incentives.rec_price if incentives and incentives.rec_price is not None else 0)))
        rec_term_years = int(revenue.get("rec_term_years") or 0) if isinstance(revenue.get("rec_term_years"), (int, float, str)) else 0

        # Production
        year1_mwh = float(_from_group(production, "year1_mwh", production.get("pvsyst_yield_mwh", incentives.pvsyst_yield_mwh if incentives and incentives.pvsyst_yield_mwh is not None else 2200)))
        degradation_pct = float(_from_group(production, "degradation_pct", production.get("pvsyst_deg_pct", incentives.pvsyst_deg_pct if incentives and incentives.pvsyst_deg_pct is not None else 0.5)))

        # Opex
        opex_per_kw_yr = float(_from_group(opex, "fixed_per_kw_yr", opex.get("opexPerKwYr", 18)))
        opex_fixed_annual = float(_from_group(opex, "fixed_annual", opex.get("fixedAnnual", 0)))
        opex_variable_per_mwh = float(_from_group(opex, "variable_per_mwh", opex.get("variablePerMwh", 0)))
        opex_escalator = float(_from_group(opex, "escalator_pct", opex.get("escalatorPct", ppa_escalator)))

        # Lease
        lease_cost_default = lease.get("leaseCost", economics.base_rent if economics and economics.base_rent is not None else 12000)
        lease_cost = float(_from_group(lease, "annual", lease_cost_default))
        lease_escalator = float(_from_group(lease, "escalator_pct", lease.get("escalatorPct", ppa_escalator)))

        # Debt
        debt_pct = float(_from_group(debt, "debt_pct", debt.get("debtPct", 0)))
        debt_interest = float(_from_group(debt, "interest_pct", debt.get("interestPct", 0)))
        debt_tenor = int(debt.get("tenor_years") or debt.get("tenor") or 0)
        dscr_target = float(_from_group(debt, "dscr_target", debt.get("dscrTarget", 0)))
        upfront_fee_pct = float(_from_group(debt, "upfront_fee_pct", debt.get("upfrontFeePct", 0)))
        closing_costs = float(_from_group(debt, "closing_costs", debt.get("closingCosts", 0)))

        # Tax & incentives
        itc_pct = float(_from_group(inc, "itc_pct", inc.get("itcEligiblePct", incentives.itc_eligible_pct if incentives and incentives.itc_eligible_pct is not None else 0)))
        discount_rate = float(_from_group(analysis, "discount_rate_pct", analysis.get("discountRatePct", 8))) / 100
        # Default analysis term to lease term (if available) or 25 years
        lease_term_years = None
        if economics and economics.term_years:
            lease_term_years = economics.term_years
        elif economics and economics.lease_start and economics.lease_end:
            delta_days = (economics.lease_end - economics.lease_start).days
            if delta_days > 0:
                lease_term_years = max(1, int(round(delta_days / 365)))

        term_years = int(
            analysis.get("term_years")
            or analysis.get("analysis_period_years")
            or lease_term_years
            or 25
        )
        salvage_pct_capex = float(_from_group(analysis, "salvage_pct_capex", analysis.get("salvagePctCapex", 0))) / 100

        itc_credit = (itc_pct / 100) * total_capex
        net_upfront = float(total_capex) - float(itc_credit) - float(closing_costs)

        escalator = float(ppa_escalator) / 100
        deg = float(degradation_pct) / 100
        lease_escal = float(lease_escalator) / 100
        opex_escal = float(opex_escalator) / 100

        revenue_series: List[float] = []
        rec_series: List[float] = []
        opex_series: List[float] = []
        lease_series: List[float] = []
        debt_service_series: List[float] = []
        net_cash_levered: List[float] = []
        net_cash_unlevered: List[float] = []

        # Simple annuity debt service (level P&I) ignoring moratorium/sculpting
        loan_principal = total_capex * (float(debt_pct) / 100)
        annual_rate = float(debt_interest / 100)
        annuity_factor = ((1 + annual_rate) ** debt_tenor - 1) / (annual_rate * (1 + annual_rate) ** debt_tenor) if (annual_rate > 0 and debt_tenor > 0) else None
        annual_debt_service = float(loan_principal / annuity_factor) if annuity_factor else 0.0
        fee_amount = float(loan_principal * (float(upfront_fee_pct) / 100))
        net_upfront_with_fees = net_upfront + fee_amount

        for i in range(term_years):
            yield_year = float(year1_mwh) * ((1 - deg) ** i)
            rec_component_price = float(rec_price) * ((1 + escalator) ** i) if (rec_term_years == 0 or i < rec_term_years) else 0.0
            ppa_component_price = float(ppa_price) * ((1 + escalator) ** i)

            rev_energy = round(yield_year * ppa_component_price, 2)
            rev_rec = round(yield_year * rec_component_price, 2)
            revenue_series.append(rev_energy)
            rec_series.append(rev_rec)

            opex_kw = round(-(float(opex_per_kw_yr) * float(capacity_kw) * ((1 + opex_escal) ** i)), 2)
            opex_fixed = round(-(float(opex_fixed_annual) * ((1 + opex_escal) ** i)), 2)
            opex_variable = round(-(float(opex_variable_per_mwh) * yield_year), 2)
            opex_total = opex_kw + opex_fixed + opex_variable
            opex_series.append(opex_total)

            lease_val = round(-(float(lease_cost) * ((1 + lease_escal) ** i)), 2)
            lease_series.append(lease_val)

            cash_before_debt = rev_energy + rev_rec + opex_total + lease_val
            debt_service = -annual_debt_service if (i < debt_tenor) else 0.0
            debt_service_series.append(debt_service)

            net_cash_unlevered.append(cash_before_debt)
            net_cash_levered.append(cash_before_debt + debt_service)

        # Salvage at end
        if term_years > 0 and salvage_pct_capex > 0:
            salvage_val = float(total_capex) * float(salvage_pct_capex)
            net_cash_levered[-1] += salvage_val
            net_cash_unlevered[-1] += salvage_val

        def npv(cfs: List[float], rate: float) -> float:
            total = 0.0
            for idx, val in enumerate(cfs):
                total += val / ((1 + rate) ** (idx + 1))
            return total

        def irr(cfs: List[float]) -> Optional[float]:
            # Simple binary search IRR for speed; returns percent
            low, high = -0.9, 1.0
            for _ in range(50):
                mid = (low + high) / 2
                npv_mid = -float(net_upfront_with_fees)
                for idx, val in enumerate(cfs):
                    npv_mid += val / ((1 + mid) ** (idx + 1))
                if npv_mid > 0:
                    low = mid
                else:
                    high = mid
            return round(high * 100, 2)

        npv_levered = npv(net_cash_levered, float(discount_rate)) - float(net_upfront_with_fees)
        npv_unlevered = npv(net_cash_unlevered, float(discount_rate)) - float(net_upfront_with_fees)
        irr_unlev = irr(net_cash_unlevered)
        irr_lev = irr(net_cash_levered)

        # DSCR series (avoid divide-by-zero)
        dscr_series = []
        for i, debt_val in enumerate(debt_service_series):
            if debt_val >= 0:
                dscr_series.append(None)
            else:
                debt_abs = abs(debt_val)
                cbf = net_cash_unlevered[i]
                dscr_series.append(round(cbf / debt_abs, 3) if debt_abs else None)

        outputs = {
            "levered_irr": irr_lev,
            "unlevered_irr": irr_unlev,
            "ppa_price": float(ppa_price),
            "npv": round(npv_levered, 0),
            "npv_unlevered": round(npv_unlevered, 0),
            "itc_credit": float(itc_credit),
            "min_dscr": min([d for d in dscr_series if d is not None], default=None),
        }

        cashflows = [
            {"label": "Revenue (PPA)", "values": revenue_series},
            {"label": "REC", "values": rec_series},
            {"label": "Opex", "values": opex_series},
            {"label": "Lease", "values": lease_series},
            {"label": "Debt Service", "values": debt_service_series},
            {"label": "Net Cash", "values": net_cash_levered},
        ]

        inputs = {
            "system": {
                "dc_kw": float(capacity_kw),
                "capex_per_w": float(capex_per_w),
                "total_capex": float(total_capex),
            },
            "production": {
                "year1_mwh": float(year1_mwh),
                "degradation_pct": float(degradation_pct),
            },
            "revenue": {
                "ppa_price_mwh": float(ppa_price),
                "ppa_escalator_pct": float(ppa_escalator),
                "rec_price_mwh": float(rec_price),
                "rec_term_years": rec_term_years,
            },
            "opex": {
                "fixed_per_kw_yr": float(opex_per_kw_yr),
                "fixed_annual": float(opex_fixed_annual),
                "variable_per_mwh": float(opex_variable_per_mwh),
                "escalator_pct": float(opex_escalator),
            },
            "land_lease": {
                "annual": float(lease_cost),
                "escalator_pct": float(lease_escalator),
            },
            "debt": {
                "debt_pct": float(debt_pct),
                "interest_pct": float(debt_interest),
                "tenor_years": debt_tenor,
                "dscr_target": float(dscr_target),
                "upfront_fee_pct": float(upfront_fee_pct),
                "closing_costs": float(closing_costs),
            },
            "incentives": {
                "itc_pct": float(itc_pct),
            },
            "analysis": {
                "term_years": term_years,
                "discount_rate_pct": float(discount_rate * 100),
                "salvage_pct_capex": float(salvage_pct_capex * 100),
            },
        }

        run = ProjectFinanceRun.objects.create(
            project=project,
            inputs=inputs,
            outputs=outputs,
            cashflows=cashflows,
            run_by=str(request.user) if request.user and request.user.is_authenticated else "",
        )

        data = self.serializer_class(run).data
        return Response(data, status=status.HTTP_201_CREATED)


class PermitRequirementViewSet(viewsets.ModelViewSet):
    queryset = PermitRequirement.objects.all().order_by("id")
    serializer_class = PermitRequirementSerializer
    filterset_fields = ["project", "level"]

    def get_queryset(self):
        qs = super().get_queryset()
        project_id = self.request.query_params.get("project") or self.request.query_params.get("project_id")
        level = self.request.query_params.get("level")
        if project_id:
            qs = qs.filter(project_id=project_id)
        if level:
            qs = qs.filter(level__iexact=level)
        search = self.request.query_params.get("search")
        if search:
            search = search.strip()
            qs = qs.filter(
                models.Q(required_permit__icontains=search)
                | models.Q(agency__icontains=search)
                | models.Q(status__icontains=search)
                | models.Q(responsible_party__icontains=search)
                | models.Q(responsible_individual__icontains=search)
                | models.Q(requirements__icontains=search)
                | models.Q(comments__icontains=search)
            )
        return qs.order_by("level", "id")

    @action(detail=False, methods=["post"], url_path="seed")
    def seed(self, request):
        """
        Explicitly seed permit requirements for a project from the template CSV in the project root.
        Body: { "project": <id>, "force": bool }
        """
        project_id = request.data.get("project")
        force = bool(request.data.get("force", False))
        if not project_id:
            return Response({"detail": "project is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({"detail": "project not found"}, status=status.HTTP_404_NOT_FOUND)

        existing = PermitRequirement.objects.filter(project=project)
        if existing.exists() and not force:
            return Response({"detail": "permits already exist; pass force=true to replace"}, status=status.HTTP_400_BAD_REQUEST)

        if force:
            existing.delete()

        created = self._seed_from_template(project)
        return Response({"detail": f"seeded {created} permits"}, status=status.HTTP_201_CREATED)

    def _seed_from_template(self, project: Project) -> int:
        """
        Seed permit rows from the template CSV in the project root.
        """
        csv_path = Path(settings.BASE_DIR) / "Development Tracker.xlsx - Permitting.csv"
        if not csv_path.exists():
            return 0

        def to_date(raw: str | None):
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

        current_level = ""
        created = 0
        with open(csv_path, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            header_found = False
            header_map = {}
            for row in reader:
                if not row:
                    continue
                # detect header
                if not header_found and "AGENCY" in [c.strip().upper() for c in row]:
                    header_found = True
                    header_map = {c.strip().upper(): idx for idx, c in enumerate(row)}
                    continue
                if not header_found:
                    continue

                first = row[0].strip().upper() if len(row) > 0 else ""
                if first in {"FEDERAL", "STATE", "LOCAL"}:
                    current_level = first.title()
                    continue

                agency_idx = header_map.get("AGENCY")
                permit_idx = header_map.get("REQUIRED PERMIT OR CONCURRENCE")
                agency_val = (row[agency_idx] if agency_idx is not None and agency_idx < len(row) else "").strip()
                permit_val = (row[permit_idx] if permit_idx is not None and permit_idx < len(row) else "").strip()
                if not agency_val and not permit_val:
                    continue

                def get(col_name: str) -> str:
                    idx = header_map.get(col_name)
                    if idx is None or idx >= len(row):
                        return ""
                    return (row[idx] or "").strip()

                start_date = to_date(get("START DATE"))
                completion_date = to_date(get("COMPLETION DATE"))
                turnaround_raw = get("TURNAROUND  (DAYS)")
                try:
                    turnaround_days = int(str(turnaround_raw).replace(",", "")) if turnaround_raw else None
                except Exception:
                    turnaround_days = None

                PermitRequirement.objects.create(
                    project=project,
                    level=current_level or "",
                    applicable=get("APPLICABLE"),
                    agency=agency_val,
                    required_permit=permit_val,
                    includes=get("INCLUDES"),
                    cup_condition=get("CUP CONDITION LINE ITEM"),
                    responsible_party=get("RESPONSIBLE PARTY"),
                    responsible_individual=get("RESPONSIBLE INDIVIDUAL"),
                    status=get("STATUS"),
                    fee=get("FEE"),
                    start_date=start_date,
                    turnaround_days=turnaround_days,
                    completion_date=completion_date,
                    agency_contact=get("AGENCY CONTACT"),
                    agency_phone=get("AGENCY CONTACT PHONE 1"),
                    requirements=get("REQUIREMENTS"),
                    approval_doc_link=get("APPROVAL DOC (DB LINK)"),
                    comments=get("COMMENTS"),
                )
                created += 1
        return created

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
