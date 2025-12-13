import os, csv, django
from django.db import connection

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()
from steps.models import Project

csv_path = "Dev Activities.csv"
phase_map = {"Pre Dev": 1, "Dev": 2, "Pre Con": 3}
bucket_labels = set(phase_map.keys())

rows = []
with open(csv_path, newline="", encoding="utf-8") as f:
    for phase_label, dev_val, precon_val in csv.reader(f):
        for label, name in [("Pre Dev", phase_label), ("Dev", dev_val), ("Pre Con", precon_val)]:
            name = (name or "").strip()
            if not name or name in bucket_labels:
                continue
            rows.append((phase_map[label], name))

# wipe existing
with connection.cursor() as cur:
    cur.execute('DELETE FROM "app"."DevTracker";')

cols = [
    '"Development Steps"', "phase", "status", "dev_type", "start_date", "end_date",
    "planned_spend", "actual_spend", "requirement", "purpose_related_activity",
    "project_id", "agency", "responsible_party", "responsible_individual", "process", "link"
]
col_list = ", ".join(cols)
placeholders = ", ".join(["%s"] * len(cols))

projects = list(Project.objects.all())
values = []
for proj in projects:
    for phase, name in rows:
        values.append([
            name, phase, None, None, None, None,
            None, None, None, None,
            proj.id, None, None, None, None, None
        ])

with connection.cursor() as cur:
    cur.executemany(
        f'INSERT INTO "app"."DevTracker" ({col_list}) VALUES ({placeholders});',
        values,
    )

print(f"Inserted {len(values)} steps across {len(projects)} projects.")
