from __future__ import annotations

from app.application.media_service import MediaApplicationService
from app.infrastructure.sqlalchemy_media_repository import SqlAlchemyMediaRepository
from app.services.storage_provider import get_storage_provider


class MediaService(MediaApplicationService):
    def __init__(self, storage_provider=None):
        super().__init__(SqlAlchemyMediaRepository(), storage_provider or get_storage_provider())

