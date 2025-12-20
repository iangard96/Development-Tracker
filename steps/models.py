# steps/models.py
from django.conf import settings
from django.db import models


class Company(models.Model):
    """
    Tenant/company container for projects and memberships.
    """

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    domain = models.CharField(max_length=255, blank=True, default="")
    contact_email = models.CharField(max_length=255, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_companies",
    )

    class Meta:
        db_table = "steps_company"

    def __str__(self) -> str:
        return self.name


class CompanyMembership(models.Model):
    """
    User membership/role within a company.
    """

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("member", "Member"),
        ("viewer", "Viewer"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("invited", "Invited"),
    ]

    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_memberships",
    )
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="member")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="active")
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invited_company_memberships",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "steps_company_membership"
        unique_together = ("user", "company")

    def __str__(self) -> str:
        return f"{self.user} @ {self.company} ({self.role})"


class Project(models.Model):
    id = models.AutoField(primary_key=True)

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="projects",
        null=True,
        blank=True,
    )
    project_name = models.CharField(max_length=255, null=False, blank=False)
    legal_name = models.CharField(max_length=255, null=False, blank=False)
    project_type = models.CharField(max_length=32, null=True, blank=True)
    project_details = models.CharField(max_length=32, null=True, blank=True)
    offtake_structure = models.CharField(max_length=32, null=True, blank=True)
    size_ac_mw = models.DecimalField(
        null=True, blank=True, max_digits=10, decimal_places=3
    )
    size_dc_mw = models.DecimalField(
        null=True, blank=True, max_digits=10, decimal_places=3
    )
    lease_option_start_date = models.DateField(
        null=True, blank=True
    )
    lease_option_expiration_date = models.DateField(
        null=True, blank=True
    )
    latitude = models.DecimalField(
        null=True, blank=True, max_digits=10, decimal_places=6
    )
    longitude = models.DecimalField(
        null=True, blank=True, max_digits=10, decimal_places=6
    )
    state = models.CharField(max_length=2, null=True, blank=True)
    county = models.CharField(max_length=128, null=True, blank=True)
    city = models.CharField(max_length=128, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    other = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "steps_project"

    def __str__(self) -> str:
        return self.project_name or f"Project {self.pk}"


class DevelopmentStep(models.Model):
    # IMPORTANT: AutoField so Django does NOT try to insert id=NULL
    id = models.AutoField(primary_key=True, db_column="id")

    risk_heatmap = models.CharField(db_column="risk_heatmap", max_length=32, blank=True, null=True)
    name = models.TextField(db_column="Development Steps")
    phase = models.IntegerField(db_column="phase", blank=True, null=True)
    start_date = models.DateField(db_column="start_date", blank=True, null=True)
    end_date = models.DateField(db_column="end_date", blank=True, null=True)
    duration_days = models.IntegerField(
        db_column="duration_days", blank=True, null=True
    )
    status = models.CharField(
        db_column="status", max_length=100, blank=True, null=True
    )
    development_type = models.CharField(
        db_column="dev_type", max_length=32, blank=True, null=True
    )
    planned_spend = models.DecimalField(
        db_column="planned_spend",
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
    )
    actual_spend = models.DecimalField(
        db_column="actual_spend",
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
    )
    agency = models.CharField(db_column="agency", max_length=255, blank=True, null=True)
    owner = models.CharField(db_column="owner", max_length=255, blank=True, null=True)
    responsible_party = models.CharField(
        db_column="responsible_party", max_length=255, blank=True, null=True
    )
    responsible_individual = models.CharField(
        db_column="responsible_individual", max_length=255, blank=True, null=True
    )
    process = models.TextField(db_column="process", blank=True, null=True)
    link = models.TextField(db_column="link", blank=True, null=True)
    requirement = models.TextField(db_column="requirement", blank=True, null=True)
    site_control_flag = models.CharField(db_column="site_control_flag", max_length=16, blank=True, null=True)
    engineering_flag = models.CharField(db_column="engineering_flag", max_length=16, blank=True, null=True)
    interconnection_flag = models.CharField(db_column="interconnection_flag", max_length=16, blank=True, null=True)
    permitting_compliance_flag = models.CharField(db_column="permitting_compliance_flag", max_length=16, blank=True, null=True)
    financing_flag = models.CharField(db_column="financing_flag", max_length=16, blank=True, null=True)
    construction_execution_flag = models.CharField(db_column="construction_execution_flag", max_length=16, blank=True, null=True)
    storage_hybrid_impact = models.CharField(db_column="storage_hybrid_impact", max_length=64, blank=True, null=True)
    milestones_ntp_gates = models.CharField(db_column="milestones_ntp_gates", max_length=255, blank=True, null=True)
    purpose_related_activity = models.IntegerField(
        db_column="purpose_related_activity", blank=True, null=True
    )

    project = models.ForeignKey(
        Project,
        models.DO_NOTHING,
        db_column="project_id",  # column on app."DevTracker"
        related_name="steps",
        blank=True,
        null=True,
    )

    class Meta:
        managed = False  # existing table
        db_table = '"app"."DevTracker"'


class ProjectContact(models.Model):
    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="contacts",
    )

    organization = models.CharField(max_length=255, blank=True)
    type = models.CharField(max_length=64, blank=True)
    responsibility = models.CharField(max_length=128, blank=True)
    name = models.CharField(max_length=255, blank=True)
    title = models.CharField(max_length=255, blank=True)
    email = models.CharField(max_length=255, blank=True)
    phone1 = models.CharField(max_length=64, blank=True)
    phone2 = models.CharField(max_length=64, blank=True)
    is_deleted = models.BooleanField(db_column="is_deleted", default=False)

    class Meta:
        db_table = "steps_project_contact"


class ProjectEconomics(models.Model):
    """
    Per-project lease/economics metadata (single row per project).
    """

    id = models.AutoField(primary_key=True)
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="economics",
    )

    owner_name = models.CharField(max_length=255, blank=True, default="")
    counterparty = models.CharField(max_length=255, blank=True, default="")
    apn = models.CharField(max_length=255, blank=True, default="")
    legal_description = models.TextField(blank=True, default="")
    option_term_years = models.IntegerField(null=True, blank=True)
    construction_term_years = models.IntegerField(null=True, blank=True)
    lease_start = models.DateField(null=True, blank=True)
    lease_end = models.DateField(null=True, blank=True)
    base_rent = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    escalator_pct = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    frequency = models.CharField(max_length=16, blank=True, default="Annual")  # Annual | Monthly
    term_years = models.IntegerField(null=True, blank=True)
    acres = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    base_rent_per_acre = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    option_payment = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    construction_payment = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)

    leased_area_image_url = models.TextField(blank=True, default="")
    leased_area_image_name = models.CharField(max_length=255, blank=True, default="")
    lease_template_url = models.TextField(blank=True, default="")
    lease_template_name = models.CharField(max_length=255, blank=True, default="")

    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "steps_project_economics"


class ProjectIncentives(models.Model):
    """
    Per-project incentives/production/financial assumptions (single row per project).
    """

    id = models.AutoField(primary_key=True)
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="incentives",
    )

    itc_eligible_pct = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    rec_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    rec_tenor_years = models.IntegerField(null=True, blank=True)
    ppa_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    ppa_esc_pct = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    ppa_term_years = models.IntegerField(null=True, blank=True)
    pvsyst_yield_mwh = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    pvsyst_deg_pct = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True)
    capex_per_kw = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    opex_per_kw_yr = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    meta = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "steps_project_incentives"


class StepOrder(models.Model):
    """
    Per-project ordering of development steps (fallback if the main table lacks a sequence column).
    """

    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="step_orders")
    step_id = models.IntegerField()
    sequence = models.IntegerField()

    class Meta:
        db_table = "steps_step_order"
        unique_together = ("project", "step_id")


class ProjectFinanceRun(models.Model):
    """
    Stores each financial model run request/response for a project.
    """

    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="finance_runs")
    inputs = models.JSONField(default=dict, blank=True)
    outputs = models.JSONField(default=dict, blank=True)
    cashflows = models.JSONField(default=list, blank=True)
    run_by = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "steps_project_finance_run"


class PermitRequirement(models.Model):
    """
    Permitting requirements per project (federal/state/local).
    """

    id = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="permits")
    level = models.CharField(max_length=16, blank=True, default="")  # Federal | State | Local
    applicable = models.CharField(max_length=8, blank=True, default="")
    agency = models.CharField(max_length=255, blank=True, default="")
    required_permit = models.CharField(max_length=255, blank=True, default="")
    includes = models.CharField(max_length=255, blank=True, default="")
    cup_condition = models.CharField(max_length=255, blank=True, default="")
    responsible_party = models.CharField(max_length=255, blank=True, default="")
    responsible_individual = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=128, blank=True, default="")
    fee = models.CharField(max_length=128, blank=True, default="")
    start_date = models.DateField(null=True, blank=True)
    turnaround_days = models.IntegerField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    agency_contact = models.CharField(max_length=255, blank=True, default="")
    agency_phone = models.CharField(max_length=255, blank=True, default="")
    requirements = models.TextField(blank=True, default="")
    approval_doc_link = models.TextField(blank=True, default="")
    comments = models.TextField(blank=True, default="")

    class Meta:
        db_table = "steps_permit_requirement"
