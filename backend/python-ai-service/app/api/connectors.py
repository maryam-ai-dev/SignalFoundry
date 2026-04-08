from fastapi import APIRouter
from pydantic import BaseModel

from app.connectors.web_connector import WebConnector

router = APIRouter()


class WebFetchRequest(BaseModel):
    url: str


@router.post("/internal/connectors/web/fetch")
async def web_fetch(body: WebFetchRequest):
    connector = WebConnector()
    result = connector.fetch_page(body.url)
    if result is None:
        return {"error": True, "message": "Failed to extract content from URL"}
    return result
