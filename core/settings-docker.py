# DevelopmentTracker/settings_docker.py
from .settings import *  # import everything from your normal settings

# Override ONLY what Docker needs
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "postgres",
        "USER": "postgres",
        "PASSWORD": "iangard96",
        "HOST": "db",     # <-- docker-compose service name
        "PORT": "5432",
    }
}

# Optional but common in docker
ALLOWED_HOSTS = ["*"]
