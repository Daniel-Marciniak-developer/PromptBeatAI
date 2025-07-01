from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
import openai
import os
import logging
import uuid

from promptbeatai.ai.openai_wrapper import request_song_generation
from promptbeatai.app.entities.generation_prompt import GenerationPrompt
from promptbeatai.loopmaker.serialize import song_to_json


OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
OPENAI_ORGANIZATION = os.getenv('OPENAI_ORGANIZATION', None)
OPENAI_PROJECT = os.getenv('OPENAI_PROJECT', None)

router = APIRouter()

openai_client = openai.Client(OPENAI_API_KEY, organization=OPENAI_ORGANIZATION, project=OPENAI_PROJECT)


song_store = {}


def generate_and_store_song(client: openai.Client, prompt: GenerationPrompt, song_id: str):
    song_store[song_id] = None
    song = request_song_generation(openai_client, prompt)
    song_store[song_id] = song


@router.post('/generate')
async def generate_song(prompt: GenerationPrompt, request: Request, background_tasks: BackgroundTasks):
    logging.info('Song generation started')
    song_id = str(uuid.uuid4())
    background_tasks.add_tasks(generate_and_store_song, openai_client, prompt, song_id)
    return {'id': song_id}


@router.get('/song/{song_id}')
async def get_song(song_id: str):
    if song_id not in song_store:
        raise HTTPException(status_code=404, detail='Song not found')
    song = song_store[song_id]
    if song is None:
        return {'id': song_id, 'status': 'pending'}
    return {'id': song_id, 'status': 'complete', 'result': song_to_json(song)}
    