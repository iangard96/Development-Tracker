# core/settings.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Basic ---
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")

# Locally you can override with DJANGO_DEBUG=False if you want
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"

# For now, be liberal so local, tunnels, and Render all work
ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "[::1]",
    ".ngrok-free.dev",
    ".loca.lt",
    ".onrender.com",
    "*",  # fine for dev/demo
]

# --- Apps ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "steps",
]

# --- Middleware ---
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# --- URLs / WSGI ---
ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"  # IMPORTANT for gunicorn on Render

# --- Templates ---
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,  # use app templates (admin, etc.)
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --- Database ---
# Local defaults: your existing Postgres on 127.0.0.1:5434
# On Render: when you link a Render Postgres, PG* vars are injected automatically.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": os.getenv("PGHOST", "127.0.0.1"),
        "PORT": os.getenv("PGPORT", "5434"),
        "NAME": os.getenv("PGDATABASE", "postgres"),
        "USER": os.getenv("PGUSER", "postgres"),
        "PASSWORD": os.getenv("PGPASSWORD", "iangard96"),
        "OPTIONS": {
            "options": "-c search_path=app,public",
            # Locally default to no SSL; on Render set PGSSLMODE=require
            "sslmode": os.getenv("PGSSLMODE", "disable"),
        },
        "CONN_MAX_AGE": 60,
    }
}

# --- Internationalization ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Chicago"
USE_I18N = True
USE_TZ = True

# --- Static ---
STATIC_URL = "/static/"
STATICFILES_DIRS = []
# Optional but nice for Render if you later use collectstatic:
STATIC_ROOT = BASE_DIR / "staticfiles"

# --- CORS / DRF ---
CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 200,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

# --- Defaults ---
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"
