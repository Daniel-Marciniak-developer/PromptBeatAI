import json
import logging
import re

from google import genai
from google.genai import types

from promptbeatai.app.entities.generation_prompt import GenerationPrompt
from promptbeatai.loopmaker.serialize import song_from_json
from promptbeatai.loopmaker.core import Song
from promptbeatai.ai.util import SYSTEM_PROMPT, stringify_generation_prompt
from promptbeatai.ai.song_generator_client import SongGeneratorClient


def request_composition_draft(
    client: genai.Client,
    prompt: GenerationPrompt
) -> str:
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(
                role="system",
                parts=[types.Part(text=SYSTEM_PROMPT)]
            ),
            types.Content(
                role="user",
                parts=[types.Part(text=stringify_generation_prompt(prompt))]
            ),
        ],
        temperature=0.9,
        max_output_tokens=16_384
    )
    return resp.text

def extract_json_from_response(response: str) -> dict:
    m = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
    if not m:
        raise ValueError("No JSON block found in Gemini response")
    return json.loads(m.group(1))

def request_song_generation(
    client: genai.Client,
    prompt: GenerationPrompt
) -> Song:
    logging.info("Sending request to Gemini API")
    draft = request_composition_draft(client, prompt)
    logging.debug(f"Gemini raw draft: {draft!r}")
    song_dict = extract_json_from_response(draft)
    song = song_from_json(song_dict)
    logging.info("Song generation successful")
    return song

class GeminiSongGeneratorClient(SongGeneratorClient):
    def __init__(self, gemini_client: genai.Client):
        self.client = gemini_client

    def request_song(self, prompt: GenerationPrompt) -> Song:
        return request_song_generation(self.client, prompt)
