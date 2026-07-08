"""
CommunityConnect Backend - Storage Service
==========================================

Abstracts file storage operations between local disk storage and Google Cloud Storage (GCS).
"""

import os
import uuid
import json
from fastapi import UploadFile
from app.core.config import settings


class StorageService:
    @staticmethod
    def _generate_unique_filename(filename: str) -> str:
        """Generates a unique name with a validated extension."""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            ext = ".jpg"
        return f"{uuid.uuid4()}{ext}"

    @classmethod
    async def upload_image(cls, file: UploadFile) -> str:
        """
        Uploads an image file to either GCS or local disk.
        Returns the public URL (GCS) or relative URL path (local).
        """
        filename = cls._generate_unique_filename(file.filename)

        if settings.STORAGE_PROVIDER == "gcs":
            from google.cloud import storage

            bucket_name = settings.GCS_BUCKET_NAME
            if not bucket_name:
                raise ValueError("GCS_BUCKET_NAME is not configured in settings.")

            # Load credentials if provided
            if settings.GCP_SERVICE_ACCOUNT_JSON:
                try:
                    if os.path.exists(settings.GCP_SERVICE_ACCOUNT_JSON):
                        client = storage.Client.from_service_account_json(
                            settings.GCP_SERVICE_ACCOUNT_JSON
                        )
                    else:
                        info = json.loads(settings.GCP_SERVICE_ACCOUNT_JSON)
                        client = storage.Client.from_service_account_info(info)
                except Exception:
                    client = storage.Client()
            else:
                client = storage.Client()

            bucket = client.bucket(bucket_name)
            blob = bucket.blob(f"images/{filename}")

            # Read file contents and upload
            content = await file.read()
            blob.upload_from_string(content, content_type=file.content_type)

            # Reset file pointer just in case
            await file.seek(0)

            # Return the GCS public URL
            return blob.public_url

        else:
            # Local Storage
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            file_path = os.path.join(settings.UPLOAD_DIR, filename)

            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)

            # Reset file pointer just in case
            await file.seek(0)

            # Return the relative URL path served by FastAPI
            return f"/uploads/{filename}"
