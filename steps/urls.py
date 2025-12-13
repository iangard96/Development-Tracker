# steps/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DevelopmentStepViewSet,
    ProjectViewSet,
    ProjectContactViewSet,
    ProjectEconomicsView,
    ProjectIncentivesView,
)

router = DefaultRouter()
router.register(r"development-steps", DevelopmentStepViewSet, basename="development-steps")
router.register(r"projects", ProjectViewSet, basename="projects")
router.register(r"project-contacts", ProjectContactViewSet, basename="project-contacts")

urlpatterns = [
    path("", include(router.urls)),
    path("projects/<int:project_id>/economics/", ProjectEconomicsView.as_view(), name="project-economics"),
    path("projects/<int:project_id>/incentives/", ProjectIncentivesView.as_view(), name="project-incentives"),
]
