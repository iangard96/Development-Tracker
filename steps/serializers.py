# steps/serializers.py
from rest_framework import serializers
from .models import DevelopmentStep, Project

class DevelopmentStepSerializer(serializers.ModelSerializer):
    # (leave your working DevStep serializer as-is)
    class Meta:
        model = DevelopmentStep
        fields = ["id","name","phase","start_date","end_date","duration_days","status", "development_type", "planned_spend", "actual_spend"]
        read_only_fields = ["id","duration_days"]

    def update(self, instance, validated_data):
        DevelopmentStep.objects.filter(pk=instance.pk).update(**validated_data)
        instance.refresh_from_db()
        return instance


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)

    # explicitly disallow nulls/blanks
    project_name = serializers.CharField(required=False, allow_null=False, allow_blank=False)
    legal_name   = serializers.CharField(required=False, allow_null=False, allow_blank=False)

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
        # hard drop any stray id
        validated_data.pop("id", None)

        # fill defaults if missing
        if not validated_data.get("project_name"):
            validated_data["project_name"] = f"New Project"
        if not validated_data.get("legal_name"):
            validated_data["legal_name"] = f"New Legal Entity"

        return super().create(validated_data)
