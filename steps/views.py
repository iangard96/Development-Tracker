# steps/views.py
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from .models import DevelopmentStep, Project
from .serializers import DevelopmentStepSerializer, ProjectSerializer

class DevelopmentStepViewSet(viewsets.ModelViewSet):
    queryset = DevelopmentStep.objects.all().order_by("id")
    serializer_class = DevelopmentStepSerializer

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        # Make a real mutable dict:
        data = request.data
        if hasattr(data, "dict"):          # QueryDict -> plain dict
            data = data.dict()
        else:
            data = dict(data)             # already a dict-like

        # Strip generated column if UI accidentally sends it
        data.pop("duration_days", None)

        # Only allow known DB fields
        allowed = {
            "name", "phase",
            "start_date", "end_date", "status","development_type","planned_spend","actual_spend"
        }
        safe_data = {k: data[k] for k in data.keys() if k in allowed}

        serializer = self.get_serializer(instance, data=safe_data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("id")
    serializer_class = ProjectSerializer

    def perform_create(self, serializer):
        # belt-and-suspenders: ensure id is not passed
        serializer.validated_data.pop("id", None)
        serializer.save()
