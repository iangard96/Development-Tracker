# steps/serializers.py
from rest_framework import serializers
from .models import DevelopmentStep, Project, ProjectContact


class DevelopmentStepSerializer(serializers.ModelSerializer):
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
            "responsible_party",
            "responsible_individual",
            "process",
            "link",
            "requirement",
            "purpose_related_activity",
            "project",
        ]
        read_only_fields = ["id", "duration_days"]
        extra_kwargs = {
            "duration_days": {"required": False, "read_only": True},
        }

    def create(self, validated_data):
        # Generated column: never send duration_days on insert
        validated_data.pop("duration_days", None)
        validated_data.pop("id", None)
        return DevelopmentStep.objects.create(**validated_data)

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
