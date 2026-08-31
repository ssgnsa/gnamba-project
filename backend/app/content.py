"""
Content versioning utilities for cache invalidation.
"""

import os
from typing import Optional

# In a production environment with multiple servers, this would use Redis or similar
# For single-server deployments, we use file-based or memory-based storage
_CONTENT_VERSION_FILE = "/tmp/egs_content_version"


def _get_stored_version() -> int:
    """Get the stored content version from file."""
    try:
        if os.path.exists(_CONTENT_VERSION_FILE):
            with open(_CONTENT_VERSION_FILE, "r") as f:
                content = f.read().strip()
                return int(content) if content.isdigit() else 0
    except (ValueError, OSError):
        pass
    return 0


def _store_version(version: int) -> None:
    """Store the content version to file."""
    try:
        with open(_CONTENT_VERSION_FILE, "w") as f:
            f.write(str(version))
    except OSError:
        # Fallback to environment variable if file fails
        os.environ["EGS_CONTENT_VERSION"] = str(version)


def bumpContentVersion() -> str:
    """
    Increment the content version and store it.
    Call this after any successful content mutation (settings, site_content, vitrine_lots, etc.).

    Returns:
        str: The new version string
    """
    current_version = _get_stored_version()
    next_version = current_version + 1
    _store_version(next_version)
    return str(next_version)


def getContentVersion() -> str:
    """
    Get current content version without subscribing to updates.

    Returns:
        str: The current version string
    """
    return str(_get_stored_version())


# For backward compatibility with frontend expectations
def get_content_version() -> str:
    """Alias for getContentVersion for frontend compatibility."""
    return getContentVersion()