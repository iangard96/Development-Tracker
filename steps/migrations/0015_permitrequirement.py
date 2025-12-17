from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("steps", "0014_projectfinancerun"),
    ]

    operations = [
        migrations.CreateModel(
            name="PermitRequirement",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("level", models.CharField(blank=True, default="", max_length=16)),
                ("applicable", models.CharField(blank=True, default="", max_length=8)),
                ("agency", models.CharField(blank=True, default="", max_length=255)),
                ("required_permit", models.CharField(blank=True, default="", max_length=255)),
                ("includes", models.CharField(blank=True, default="", max_length=255)),
                ("cup_condition", models.CharField(blank=True, default="", max_length=255)),
                ("responsible_party", models.CharField(blank=True, default="", max_length=255)),
                ("responsible_individual", models.CharField(blank=True, default="", max_length=255)),
                ("status", models.CharField(blank=True, default="", max_length=128)),
                ("fee", models.CharField(blank=True, default="", max_length=128)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("turnaround_days", models.IntegerField(blank=True, null=True)),
                ("completion_date", models.DateField(blank=True, null=True)),
                ("agency_contact", models.CharField(blank=True, default="", max_length=255)),
                ("agency_phone", models.CharField(blank=True, default="", max_length=255)),
                ("requirements", models.TextField(blank=True, default="")),
                ("approval_doc_link", models.TextField(blank=True, default="")),
                ("comments", models.TextField(blank=True, default="")),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="permits",
                        to="steps.project",
                    ),
                ),
            ],
            options={
                "db_table": "steps_permit_requirement",
            },
        ),
    ]
