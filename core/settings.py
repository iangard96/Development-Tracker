# core/settings.py
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Basic ---
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = True
ALLOWED_HOSTS = [
    "127.0.0.1",
    "localhost",
    "[::1]",
    ".onrender.com",
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
WSGI_APPLICATION = None  # using runserver only; set to "core.wsgi.application" for WSGI deploys

# --- Templates ---
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": False,
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

# --- Database (matches your earlier dump) ---

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
            "sslmode": os.getenv("PGSSLMODE", "disable"),
        },
        "CONN_MAX_AGE": 60,
    }
}

'''
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DT_DB_NAME", "postgres"),
        "USER": os.getenv("DT_DB_USER", "postgres"),
        "PASSWORD": os.getenv("DT_DB_PASSWORD", "iangard96"),
        "HOST": os.getenv("DT_DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DT_DB_PORT", "5434"),
    }
}
'''

# --- Internationalization ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "America/Chicago"
USE_I18N = True
USE_TZ = True

# --- Static ---
STATIC_URL = "/static/"
STATICFILES_DIRS = []

# --- CORS / DRF ---
CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 200,
    # Force JSON responses; avoids needing the browsable API template when hitting the API via tunnel/browser
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}

# --- Defaults ---
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"
