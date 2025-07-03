from types import NoneType
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, field_validator

from promptbeatai.loopmaker.core import Song
from promptbeatai.loopmaker.serialize import song_from_json, song_to_json

class GenerationPrompt(BaseModel):
    text_prompt: str
    other_settings: dict[str, Any]
    reference_composition: Optional[dict[str, Any]] = None
