"""
CommunityConnect Backend - Image Upload Endpoint
===============================================

Handles file uploads, validating formats (jpg, jpeg, png, webp) and size limits (15MB).
"""

import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.api.deps import get_current_user
from app.models.user import User
from app.services.storage import StorageService

router = APIRouter()

# Max file size limit: 15MB (in bytes)
MAX_FILE_SIZE = 20 * 1024 * 1024
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
SUPPORTED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Uploads an image (JPEG, PNG, WEBP) up to 15MB.
    Requires an authenticated user.
    """
    # 1. Validate file format by extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only jpg, jpeg, png, and webp are allowed."
        )

    # 2. Validate file format by content type
    if file.content_type not in SUPPORTED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported content type '{file.content_type}'. Must be a valid image."
        )

    # 3. Validate file size (chunked check to avoid memory overflow)
    try:
        # Read the file up to MAX_FILE_SIZE + 1
        content = await file.read(MAX_FILE_SIZE + 1)
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="File size exceeds the 15MB limit."
            )
        # Seek back to start for the storage service to read it
        await file.seek(0)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating file size: {str(e)}"
        )

    # 4. Upload file using Storage Service
    try:
        image_url = await StorageService.upload_image(file)
        return {"url": image_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )
