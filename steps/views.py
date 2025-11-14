from datetime import date
from rest_framework import viewsets
from .models import DevelopmentStep
from .serializers import DevelopmentStepSerializer

class DevelopmentStepViewSet(viewsets.ModelViewSet):
    queryset = DevelopmentStep.objects.all().order_by('sequence', 'id')
    serializer_class = DevelopmentStepSerializer

    def _apply_duration(self, instance: DevelopmentStep):
        sd, ed = instance.start_date, instance.end_date
        if isinstance(sd, date) and isinstance(ed, date):
            instance.duration_days = (ed - sd).days
        else:
            instance.duration_days = None

    def perform_update(self, serializer):
        instance = serializer.save()
        self._apply_duration(instance)
        instance.save(update_fields=['duration_days'])

    def perform_create(self, serializer):
        instance = serializer.save()
        self._apply_duration(instance)
        instance.save(update_fields=['duration_days'])
