# steps/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DevelopmentStepViewSet, ProjectViewSet, ProjectContactViewSet

router = DefaultRouter()
router.register(r"development-steps", DevelopmentStepViewSet, basename="development-steps")
router.register(r"projects", ProjectViewSet, basename="projects")
router.register(r"project-contacts", ProjectContactViewSet, basename="project-contacts")

urlpatterns = [
    path("", include(router.urls)),
]

