# steps/serializers.py
from rest_framework import serializers
from .models import DevelopmentStep

# Only these are ever writable
WRITABLE_FIELDS = {"sequence", "name", "phase", "status", "start_date", "end_date"}

class DevelopmentStepSerializer(serializers.ModelSerializer):
    # DO NOT declare duration_days as a model field here.
    # We'll add it to the output manually in to_representation().

    class Meta:
        model = DevelopmentStep
        fields = (
            "id",
            "sequence",
            "name",
            "phase",
            "status",
            "start_date",
            "end_date",
            # intentionally NOT listing duration_days here
        )
        read_only_fields = ("id",)  # duration_days is not even part of validated data

    def to_representation(self, instance):
        # serialize normal fields
        data = super().to_representation(instance)
        # append the DB-computed generated column strictly as read-only output
        data["duration_days"] = getattr(instance, "duration_days", None)
        return data

    def update(self, instance, validated_data):
        # strictly whitelist what we write so duration_days can never get included
        allowed = {k: v for k, v in validated_data.items() if k in WRITABLE_FIELDS}
        for k, v in allowed.items():
            setattr(instance, k, v)
        # write only those columns → prevents DEFAULT on duration_days
        if allowed:
            instance.save(update_fields=list(allowed.keys()))
        return instance

    def create(self, validated_data):
        allowed = {k: v for k, v in validated_data.items() if k in WRITABLE_FIELDS}
        return DevelopmentStep.objects.create(**allowed)
