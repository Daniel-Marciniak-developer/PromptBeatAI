import json
import logging
import openai
import re
from typing import cast

from promptbeatai.app.entities.generation_prompt import GenerationPrompt
from promptbeatai.loopmaker.serialize import song_from_json, song_to_json
from promptbeatai.loopmaker.core import Song
from promptbeatai.ai.util import SYSTEM_PROMPT, stringify_generation_prompt
from promptbeatai.ai.song_generator_client import SongGeneratorClient


def request_composition_draft(client: openai.OpenAI, prompt: GenerationPrompt) -> str:
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': stringify_generation_prompt(prompt)}
        ],
        temperature=0.9,
        max_completion_tokens=16384
    )
    s = response.choices[0].message.content
    if isinstance(s, str):
        return s
    raise RuntimeError(f'Expected OpenAI API to return str, got {str(s.__class__)} instead')


def extract_json_from_response(response: str) -> dict:
    match = re.search(r'```json\s*(\{.*?\})\s*```', response, re.DOTALL)
    if match:
        json_str = match.group(1)
        return json.loads(json_str)
    raise ValueError('No JSON block found!')


def request_song_generation(client: openai.OpenAI, prompt: GenerationPrompt) -> Song:
    logging.info(f'Sending request to OpenAI API')
    response = request_composition_draft(client, prompt)
    logging.debug(f'Received response {response}')
    song_dict = extract_json_from_response(response)
    # FIXME: Validation introduces more problems right now, come back to it later
    # try:
    #     schm = json.loads(song_schema)
    #     print(f'schm={json.dumps(schm)}')
    #     print(f'inst={json.dumps(song_dict)}')
        # jsonschema.validate(instance=song_dict, schema=schm)
    # except jsonschema.ValidationError:
        # raise jsonschema.ValidationError('OpenAI returned JSON which does not match song schema')
    song = song_from_json(song_dict)
    logging.info(f'Song generation succesful')
    return song


class OpenAISongGeneratorClient(SongGeneratorClient):
    def __init__(self, openai_client: openai.OpenAI):
        self.openai_client = openai_client

    def request_song(self, prompt: GenerationPrompt):
        return request_song_generation(self.openai_client, prompt)
