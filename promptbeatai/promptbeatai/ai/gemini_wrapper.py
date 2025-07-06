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
    combined_prompt = f"{SYSTEM_PROMPT}\n\n{stringify_generation_prompt(prompt)}"
    resp = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(
                role="user",
                parts=[types.Part(text=combined_prompt)]
            ),
        ]
    )
    return resp.text

def extract_json_from_response(response: str) -> dict:
    patterns = [
        r'```json\s*(\{.*?\})\s*```',
        r'```\s*(\{.*?\})\s*```',
        r'(\{.*?\})',
    ]

    for pattern in patterns:
        m = re.search(pattern, response, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except json.JSONDecodeError:
                continue

    logging.error(f"Failed to extract JSON from Gemini response: {response}")
    raise ValueError(f"No valid JSON block found in Gemini response. Response was: {response[:500]}...")

def request_song_generation(
    client: genai.Client,
    prompt: GenerationPrompt
) -> Song:
    logging.info("Sending request to Gemini API")
    draft = request_composition_draft(client, prompt)
    logging.info(f"Gemini raw response: {draft}")
    song_dict = extract_json_from_response(draft)
    song = song_from_json(song_dict)
    logging.info("Song generation successful")
    return song

class GeminiSongGeneratorClient(SongGeneratorClient):
    def __init__(self, gemini_client: genai.Client):
        self.client = gemini_client

    def request_song(self, prompt: GenerationPrompt) -> Song:
        return request_song_generation(self.client, prompt)
