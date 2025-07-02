from typing import Any, Optional
from pydantic import BaseModel, field_validator

from promptbeatai.loopmaker.core import Song
from promptbeatai.loopmaker.serialize import song_from_json, song_to_json

class GenerationPrompt(BaseModel):
    text_prompt: str
    other_settings: dict[str, Any]
    reference_composition: Optional[Song] = None

    class Config:
        arbitrary_types_allowed = True

    @field_validator('reference_composition', mode='before')
    @classmethod
    def parse_reference_composition(cls, v):
        if isinstance(v, dict):
            return song_from_json(v)
        return v
    
    def model_dump(self, *args, **kwargs):
        d = super().model_dump(*args, **kwargs)
        if self.reference_composition is not None:
            d['reference_composition'] = song_to_json(self.reference_composition)
        return d
