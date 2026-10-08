from __future__ import annotations

import threading
import time
from collections import defaultdict, deque


class InMemoryIpRateLimiter:
    """Small per-process limiter for public forms; requests still fail closed."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._attempts: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, ip_address: str, *, maximum: int, window_seconds: int) -> bool:
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            attempts = self._attempts[ip_address]
            while attempts and attempts[0] <= cutoff:
                attempts.popleft()
            if len(attempts) >= maximum:
                return False
            attempts.append(now)
            return True


public_form_limiter = InMemoryIpRateLimiter()
