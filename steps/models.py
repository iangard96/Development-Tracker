# steps/models.py
from django.db import models

class DevelopmentStep(models.Model):
    id = models.IntegerField(primary_key=True)
    name = models.TextField(db_column='Development Steps')
    phase = models.IntegerField(db_column='phase', blank=True, null=True)
    start_date = models.DateField(db_column='start_date', blank=True, null=True)
    end_date = models.DateField(db_column='end_date', blank=True, null=True)
    duration_days = models.IntegerField(db_column='duration_days', blank=True, null=True)
    status = models.CharField(db_column='status', max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = '"app"."DevTracker"'


class Project(models.Model):
    # ✅ let Postgres identity/serial fill this in
    id = models.AutoField(primary_key=True)

    project_name = models.CharField(max_length=255, null=False, blank=False)
    legal_name = models.CharField(max_length=255, null=False, blank=False)
    project_type = models.CharField(max_length=32, null=True, blank=True)
    project_details = models.CharField(max_length=32, null=True, blank=True)
    offtake_structure = models.CharField(max_length=32, null=True, blank=True)
    size_ac_mw = models.DecimalField(null=True, blank=True, max_digits=10, decimal_places=3)
    size_dc_mw = models.DecimalField(null=True, blank=True, max_digits=10, decimal_places=3)
    latitude = models.DecimalField(null=True, blank=True, max_digits=10, decimal_places=6)
    longitude = models.DecimalField(null=True, blank=True, max_digits=10, decimal_places=6)
    state = models.CharField(max_length=2, null=True, blank=True)
    county = models.CharField(max_length=128, null=True, blank=True)
    city = models.CharField(max_length=128, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    other = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'steps_project'
