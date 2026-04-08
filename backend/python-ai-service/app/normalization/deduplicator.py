import hashlib


def make_canonical_id(platform: str, source_id: str) -> str:
    return hashlib.sha256(f"{platform}:{source_id}".encode()).hexdigest()[:16]
