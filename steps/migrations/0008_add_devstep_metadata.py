# steps/migrations/0008_add_devstep_metadata.py
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("steps", "0007_projectcontact"),
    ]

    # Make this migration a no-op on fresh databases (like Render)
    operations = []
