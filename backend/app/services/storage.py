import os
import uuid
import hashlib
from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
ALLOWED_MIME_TYPES = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "application/pdf": "pdf"
}

class StorageService:
    def __init__(self, upload_dir: str = settings.UPLOAD_DIR):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_filename(self, filename: str) -> str:
        # Strip directory path separators to prevent path traversal
        clean = Path(filename).name
        # Keep alphanumeric, dots, underscores, dashes
        safe_chars = "".join(c for c in clean if c.isalnum() or c in "._-")
        return safe_chars or "evidence_file"

    async def save_file(self, file: UploadFile) -> Tuple[str, str, int, str, str]:
        """
        Saves uploaded file securely.
        Returns: (stored_filename, storage_full_path, file_size_bytes, content_type, sha256_hash)
        """
        original_name = file.filename or "unknown"
        ext = original_name.split(".")[-1].lower() if "." in original_name else ""
        
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Read content and calculate sha256
        content = await file.read()
        file_size = len(content)

        # Check file size limit
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if file_size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        # Magic byte validation for true mime type verification
        content_type = file.content_type or "application/octet-stream"
        if ext in ("png", "jpg", "jpeg"):
            if not (content.startswith(b"\x89PNG\r\n\x1a\n") or content.startswith(b"\xff\xd8\xff")):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File header does not match valid PNG or JPEG image format"
                )
        elif ext == "pdf":
            if not content.startswith(b"%PDF"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File header does not match valid PDF document format"
                )

        # Compute SHA256
        sha256_hash = hashlib.sha256(content).hexdigest()

        # Generate unique storage filename
        sanitized = self._sanitize_filename(original_name)
        storage_filename = f"{uuid.uuid4().hex}_{sanitized}"
        target_path = self.upload_dir / storage_filename

        # Write to disk
        with open(target_path, "wb") as f:
            f.write(content)

        # Rewind file position
        await file.seek(0)

        return (
            original_name,
            str(target_path),
            file_size,
            content_type,
            sha256_hash
        )

    def get_file_path(self, storage_path: str) -> Path:
        p = Path(storage_path)
        # Ensure path is inside upload_dir
        try:
            p.resolve().relative_to(self.upload_dir.resolve())
        except ValueError:
            raise HTTPException(status_code=403, detail="Access to specified file path is forbidden")
            
        if not p.exists():
            raise HTTPException(status_code=404, detail="Evidence file not found on disk")
        return p

storage_service = StorageService()
