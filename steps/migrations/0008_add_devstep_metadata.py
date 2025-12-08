from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("steps", "0007_projectcontact"),
    ]

    operations = [
        migrations.RunSQL("CREATE SCHEMA IF NOT EXISTS app;"),
        
        migrations.RunSQL(
            """
            ALTER TABLE app."DevTracker"
            ADD COLUMN IF NOT EXISTS agency varchar(255);

            ALTER TABLE app."DevTracker"
            ADD COLUMN IF NOT EXISTS responsible_party varchar(255);

            ALTER TABLE app."DevTracker"
            ADD COLUMN IF NOT EXISTS responsible_individual varchar(255);

            ALTER TABLE app."DevTracker"
            ADD COLUMN IF NOT EXISTS process text;

            ALTER TABLE app."DevTracker"
            ADD COLUMN IF NOT EXISTS link text;

            ALTER TABLE app."DevTracker"
            ADD COLUMN IF NOT EXISTS requirement text;

            ALTER TABLE app."DevTracker"
            ADD COLUMN IF NOT EXISTS purpose_related_activity integer;
            """,
            """
            ALTER TABLE app."DevTracker" DROP COLUMN IF EXISTS purpose_related_activity;
            ALTER TABLE app."DevTracker" DROP COLUMN IF EXISTS requirement;
            ALTER TABLE app."DevTracker" DROP COLUMN IF EXISTS link;
            ALTER TABLE app."DevTracker" DROP COLUMN IF EXISTS process;
            ALTER TABLE app."DevTracker" DROP COLUMN IF EXISTS responsible_individual;
            ALTER TABLE app."DevTracker" DROP COLUMN IF EXISTS responsible_party;
            ALTER TABLE app."DevTracker" DROP COLUMN IF EXISTS agency;
            """,
        )
    ]
