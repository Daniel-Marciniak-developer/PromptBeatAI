from pydub import AudioSegment
from typing import Any, Optional, TypedDict

from promptbeatai.loopmaker.core import Song


class GenerationPrompt(TypedDict):
    text_prompt: str
    other_settings: dict[str, Any]
    reference_composition: Optional[Song]
    reference_sound: Optional[AudioSegment]
