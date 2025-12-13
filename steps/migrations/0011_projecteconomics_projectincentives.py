from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("steps", "0010_project_lease_option_expiration_date_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProjectEconomics",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("owner_name", models.CharField(blank=True, default="", max_length=255)),
                ("counterparty", models.CharField(blank=True, default="", max_length=255)),
                ("apn", models.CharField(blank=True, default="", max_length=255)),
                ("legal_description", models.TextField(blank=True, default="")),
                ("option_term_years", models.IntegerField(blank=True, null=True)),
                ("construction_term_years", models.IntegerField(blank=True, null=True)),
                ("lease_start", models.DateField(blank=True, null=True)),
                ("lease_end", models.DateField(blank=True, null=True)),
                ("base_rent", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                ("escalator_pct", models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True)),
                ("frequency", models.CharField(blank=True, default="Annual", max_length=16)),
                ("term_years", models.IntegerField(blank=True, null=True)),
                ("leased_area_image_url", models.TextField(blank=True, default="")),
                ("leased_area_image_name", models.CharField(blank=True, default="", max_length=255)),
                ("lease_template_url", models.TextField(blank=True, default="")),
                ("lease_template_name", models.CharField(blank=True, default="", max_length=255)),
                ("meta", models.JSONField(blank=True, default=dict)),
                (
                    "project",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="economics",
                        to="steps.project",
                    ),
                ),
            ],
            options={
                "db_table": "steps_project_economics",
            },
        ),
        migrations.CreateModel(
            name="ProjectIncentives",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("itc_eligible_pct", models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True)),
                ("rec_price", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("rec_tenor_years", models.IntegerField(blank=True, null=True)),
                ("ppa_price", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("ppa_esc_pct", models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True)),
                ("ppa_term_years", models.IntegerField(blank=True, null=True)),
                ("pvsyst_yield_mwh", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("pvsyst_deg_pct", models.DecimalField(blank=True, decimal_places=3, max_digits=6, null=True)),
                ("capex_per_kw", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("opex_per_kw_yr", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("meta", models.JSONField(blank=True, default=dict)),
                (
                    "project",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="incentives",
                        to="steps.project",
                    ),
                ),
            ],
            options={
                "db_table": "steps_project_incentives",
            },
        ),
    ]
