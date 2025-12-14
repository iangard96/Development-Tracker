from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("steps", "0012_add_lease_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="StepOrder",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("step_id", models.IntegerField()),
                ("sequence", models.IntegerField()),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="step_orders",
                        to="steps.project",
                    ),
                ),
            ],
            options={
                "db_table": "steps_step_order",
                "unique_together": {("project", "step_id")},
            },
        ),
    ]
