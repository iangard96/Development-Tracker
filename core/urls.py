from django.urls import path, include
from rest_framework.routers import DefaultRouter
from steps.views import DevelopmentStepViewSet

router = DefaultRouter()
router.register(r"development-steps", DevelopmentStepViewSet, basename="development-step")

urlpatterns = [
    path("api/", include(router.urls)),
]
