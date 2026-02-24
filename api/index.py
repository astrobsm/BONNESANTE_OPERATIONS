"""
Vercel Serverless Function entry point.
Wraps the FastAPI app as a Vercel-compatible handler.
"""
import sys
import os

# Add backend directory to Python path so 'app' package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Force pydantic-settings to look for .env in the backend directory
os.environ.setdefault("ENV_FILE", os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from app.main import app  # noqa: E402 — the FastAPI instance Vercel will serve
