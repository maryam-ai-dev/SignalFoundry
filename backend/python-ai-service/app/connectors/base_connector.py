from abc import ABC, abstractmethod


class BaseConnector(ABC):
    @abstractmethod
    def search_posts(self, query: str, window_days: int, limit: int) -> list[dict]:
        ...

    @abstractmethod
    def fetch_comments(self, post_id: str, limit: int) -> list[dict]:
        ...
