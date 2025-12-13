from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("steps", "0011_projecteconomics_projectincentives"),
    ]

    operations = [
        migrations.AddField(
            model_name="projecteconomics",
            name="acres",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="projecteconomics",
            name="base_rent_per_acre",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name="projecteconomics",
            name="construction_payment",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
        ),
        migrations.AddField(
            model_name="projecteconomics",
            name="option_payment",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True),
        ),
    ]
