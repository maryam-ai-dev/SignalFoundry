from pydantic import BaseModel


class AnalyzeVoiceSampleRequest(BaseModel):
    workspace_id: str
    sample_type: str  # TEXT | AUDIO
    content: str | None = None
    file_path: str | None = None


class VoiceSampleAnalysisResult(BaseModel):
    features: dict
    quality_score: float
    is_sufficient: bool
    word_count: int
