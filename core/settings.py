# core/settings.py
from pathlib import Path
import os
import dj_database_url

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
# Locally: fall back to your existing Postgres on 127.0.0.1:5434
# Render: uses DATABASE_URL env var (which you already have set)
LOCAL_DB_URL = "postgresql://postgres:iangard96@127.0.0.1:5434/postgres"

DATABASES = {
    "default": dj_database_url.config(
        env="DATABASE_URL",        # what Render sets
        default=LOCAL_DB_URL,      # used locally if DATABASE_URL is not set
        conn_max_age=600,
        ssl_require=os.getenv("RENDER") == "true",  # only require SSL on Render
    )
}

# --- Internationalization ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Chicago"
USE_I18N = True
USE_TZ = True

# --- Static ---
STATIC_URL = "/static/"
STATICFILES_DIRS = []
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
