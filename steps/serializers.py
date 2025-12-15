# steps/serializers.py
from rest_framework import serializers
from .models import DevelopmentStep, Project, ProjectContact, ProjectEconomics, ProjectIncentives


class DevelopmentStepSerializer(serializers.ModelSerializer):
    sequence = serializers.IntegerField(read_only=True, required=False)
    # expose the project FK as its ID
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = DevelopmentStep
        fields = [
            "id",
            "risk_heatmap",
            "name",
            "phase",
            "start_date",
            "end_date",
            "duration_days",
            "status",
            "development_type",
            "planned_spend",
            "actual_spend",
            "agency",
            "owner",
            "responsible_party",
            "responsible_individual",
            "process",
            "link",
            "requirement",
            "site_control_flag",
            "engineering_flag",
            "interconnection_flag",
            "permitting_compliance_flag",
            "financing_flag",
            "construction_execution_flag",
            "storage_hybrid_impact",
            "milestones_ntp_gates",
            "purpose_related_activity",
            "project",
            "sequence",
        ]
        read_only_fields = ["id", "duration_days"]
        extra_kwargs = {
            "duration_days": {"required": False, "read_only": True},
        }

    def create(self, validated_data):
        """
        Insert without touching the generated column duration_days.
        Django's default insert will include NULL for duration_days, which
        Postgres rejects because the column is generated, so we perform a
        manual INSERT that omits the column entirely.
        """
        from django.db import connection

        # ensure only expected fields are inserted
        payload = {**validated_data}
        payload.pop("duration_days", None)
        payload.pop("id", None)

        cols = [
            ("risk_heatmap", payload.get("risk_heatmap")),
            ('"Development Steps"', payload.get("name")),
            ("phase", payload.get("phase")),
            ("start_date", payload.get("start_date")),
            ("end_date", payload.get("end_date")),
            ("status", payload.get("status")),
            ("dev_type", payload.get("development_type")),
            ("planned_spend", payload.get("planned_spend")),
            ("actual_spend", payload.get("actual_spend")),
            ("agency", payload.get("agency")),
            ("owner", payload.get("owner")),
            ("responsible_party", payload.get("responsible_party")),
            ("responsible_individual", payload.get("responsible_individual")),
            ("process", payload.get("process")),
            ("link", payload.get("link")),
            ("requirement", payload.get("requirement")),
            ("site_control_flag", payload.get("site_control_flag")),
            ("engineering_flag", payload.get("engineering_flag")),
            ("interconnection_flag", payload.get("interconnection_flag")),
            ("permitting_compliance_flag", payload.get("permitting_compliance_flag")),
            ("financing_flag", payload.get("financing_flag")),
            ("construction_execution_flag", payload.get("construction_execution_flag")),
            ("storage_hybrid_impact", payload.get("storage_hybrid_impact")),
            ("milestones_ntp_gates", payload.get("milestones_ntp_gates")),
            ("purpose_related_activity", payload.get("purpose_related_activity")),
            ("project_id", payload.get("project").id if payload.get("project") else None),
        ]

        col_names = [c for c, _ in cols]
        placeholders = ["%s"] * len(cols)
        values = [v for _, v in cols]

        with connection.cursor() as cur:
            cur.execute(
                f'''
                INSERT INTO "app"."DevTracker" ({", ".join(col_names)})
                VALUES ({", ".join(placeholders)})
                RETURNING id;
                ''',
                values,
            )
            new_id = cur.fetchone()[0]

        return DevelopmentStep.objects.get(pk=new_id)

    def update(self, instance, validated_data):
        # optimized update: go through queryset.update, then refresh
        DevelopmentStep.objects.filter(pk=instance.pk).update(**validated_data)
        instance.refresh_from_db()
        return instance


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    project_name = serializers.CharField(
        required=False, allow_null=False, allow_blank=False
    )
    legal_name = serializers.CharField(
        required=False, allow_null=False, allow_blank=False
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "project_name",
            "legal_name",
            "project_type",
            "project_details",
            "offtake_structure",
            "size_ac_mw",
            "size_dc_mw",
            "lease_option_start_date",
            "lease_option_expiration_date",
            "latitude",
            "longitude",
            "state",
            "county",
            "city",
            "address",
            "other",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data.pop("id", None)
        if not validated_data.get("project_name"):
            validated_data["project_name"] = "New Project"
        if not validated_data.get("legal_name"):
            validated_data["legal_name"] = "New Legal Entity"
        return super().create(validated_data)


class ProjectContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectContact
        fields = [
            "id",
            "project",
            "organization",
            "type",
            "responsibility",
            "name",
            "title",
            "email",
            "phone1",
            "phone2",
            "is_deleted",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "organization": {"required": False, "allow_blank": True, "allow_null": True},
            "type": {"required": False, "allow_blank": True, "allow_null": True},
            "responsibility": {"required": False, "allow_blank": True, "allow_null": True},
            "name": {"required": False, "allow_blank": True, "allow_null": True},
            "title": {"required": False, "allow_blank": True, "allow_null": True},
            "email": {"required": False, "allow_blank": True, "allow_null": True},
            "phone1": {"required": False, "allow_blank": True, "allow_null": True},
            "phone2": {"required": False, "allow_blank": True, "allow_null": True},
            "is_deleted": {"required": False},
            "project": {"required": True},
        }

    def create(self, validated_data):
        # ensure is_deleted defaults to False for legacy table that has no DB default
        validated_data.setdefault("is_deleted", False)
        return super().create(validated_data)


class ProjectEconomicsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectEconomics
        fields = [
            "id",
            "project",
            "owner_name",
            "counterparty",
            "apn",
            "legal_description",
            "option_term_years",
            "construction_term_years",
            "lease_start",
            "lease_end",
            "base_rent",
            "base_rent_per_acre",
            "acres",
            "option_payment",
            "construction_payment",
            "escalator_pct",
            "frequency",
            "term_years",
            "leased_area_image_url",
            "leased_area_image_name",
            "lease_template_url",
            "lease_template_name",
            "meta",
        ]
        read_only_fields = ["id"]


class ProjectIncentivesSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectIncentives
        fields = [
            "id",
            "project",
            "itc_eligible_pct",
            "rec_price",
            "rec_tenor_years",
            "ppa_price",
            "ppa_esc_pct",
            "ppa_term_years",
            "pvsyst_yield_mwh",
            "pvsyst_deg_pct",
            "capex_per_kw",
            "opex_per_kw_yr",
            "meta",
        ]
        read_only_fields = ["id"]
