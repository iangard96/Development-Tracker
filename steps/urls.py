# steps/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    LogoutView,
    MeView,
    RefreshView,
    DevelopmentStepViewSet,
    ProjectViewSet,
    ProjectContactViewSet,
    ProjectEconomicsView,
    ProjectIncentivesView,
    ProjectFinanceRunView,
    PermitRequirementViewSet,
)

router = DefaultRouter()
router.register(r"development-steps", DevelopmentStepViewSet, basename="development-steps")
router.register(r"projects", ProjectViewSet, basename="projects")
router.register(r"project-contacts", ProjectContactViewSet, basename="project-contacts")
router.register(r"permit-requirements", PermitRequirementViewSet, basename="permit-requirements")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
    path("projects/<int:project_id>/economics/", ProjectEconomicsView.as_view(), name="project-economics"),
    path("projects/<int:project_id>/incentives/", ProjectIncentivesView.as_view(), name="project-incentives"),
    path("projects/<int:project_id>/finance/run/", ProjectFinanceRunView.as_view(), name="project-finance-run"),
]
