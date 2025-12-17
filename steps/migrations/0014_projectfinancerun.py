from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("steps", "0013_steporder"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectFinanceRun",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("inputs", models.JSONField(blank=True, default=dict)),
                ("outputs", models.JSONField(blank=True, default=dict)),
                ("cashflows", models.JSONField(blank=True, default=list)),
                ("run_by", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="finance_runs",
                        to="steps.project",
                    ),
                ),
            ],
            options={
                "db_table": "steps_project_finance_run",
            },
        ),
    ]
