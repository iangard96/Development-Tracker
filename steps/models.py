# steps/models.py
from django.db import models


class Project(models.Model):
    id = models.AutoField(primary_key=True)

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
    responsible_party = models.CharField(
        db_column="responsible_party", max_length=255, blank=True, null=True
    )
    responsible_individual = models.CharField(
        db_column="responsible_individual", max_length=255, blank=True, null=True
    )
    process = models.TextField(db_column="process", blank=True, null=True)
    link = models.TextField(db_column="link", blank=True, null=True)
    requirement = models.TextField(db_column="requirement", blank=True, null=True)
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
