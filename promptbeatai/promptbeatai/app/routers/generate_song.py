import google.genai
from io import BytesIO
from typing import cast
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import StreamingResponse, Response, RedirectResponse
import openai
import os
import logging
import uuid

from promptbeatai.ai.openai_wrapper import OpenAISongGeneratorClient
from promptbeatai.ai.gemini_wrapper import GeminiSongGeneratorClient
from promptbeatai.app.entities.generation_prompt import GenerationPrompt
from promptbeatai.app.middleware.rate_limiter import limiter
from promptbeatai.loopmaker.serialize import song_to_json
from promptbeatai.loopmaker.core import Song


router = APIRouter()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', None)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', None)

if GEMINI_API_KEY:
    client = google.genai.Client(api_key=GEMINI_API_KEY)
    song_generator_client = GeminiSongGeneratorClient(client)
elif OPENAI_API_KEY:
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    song_generator_client = OpenAISongGeneratorClient(client)
else:
    raise RuntimeError("No API key provided for either Gemini or OpenAI")

song_store = {}
failed_songs = set()


def generate_and_store_song(prompt: GenerationPrompt, song_id: str):
    successful = False
    i = 0
    while not successful and i < 3:
        try:
            song_store[song_id] = None
            song = song_generator_client.request_song(prompt)
            song_store[song_id] = song
            successful = True
        except Exception as e:
            logging.error(f"Something went wrong {e}")
            i += 1
    if not successful:
        failed_songs.add(song_id)


@router.post('/generate')
@limiter.limit('10/hour')
async def generate_song(prompt: GenerationPrompt, request: Request, background_tasks: BackgroundTasks):
    logging.info('Song generation started')
    if os.getenv('DEBUG', 0) == '1':
        return {'id': '0', 'mode': 'mock'}
    song_id = str(uuid.uuid4())
    background_tasks.add_task(generate_and_store_song, prompt, song_id)

    # Determine which API is being used
    mode = 'gemini' if GEMINI_API_KEY else 'openai'
    return {'id': song_id, 'mode': mode}


@router.get('/song/{song_id}')
async def get_song(song_id: str):
    if song_id == '0':
        return {
            "bpm": 70,
            "beats_per_bar": 4,
            "steps_per_beat": 4,
            "loops_in_context": [
                {
                "loop": {
                    "bars": 4,
                    "gain": -5.0,
                    "mute": False,
                    "tracks": {
                    "piano": {
                        "gen": {
                        "type": "piano",
                        "folderpath": "samples/piano/lofi_piano/"
                        },
                        "hits": [
                        {"step": 0, "note": "C4", "steps": 1.0},
                        {"step": 4, "note": "E4", "steps": 1.0},
                        {"step": 8, "note": "G4", "steps": 1.0},
                        {"step": 12, "note": "B3", "steps": 1.0}
                        ],
                        "gain": -5.0,
                        "mute": False
                    },
                    "synth": {
                        "gen": {
                        "type": "synth",
                        "waveform": "sine",
                        "ahdsr_envelope": {
                            "attack_ms": 200,
                            "hold_ms": 100,
                            "decay_ms": 300,
                            "sustain_level": 0.7,
                            "release_ms": 500
                        },
                        "amplitude": 0.8,
                        "sample_rate": 44100
                        },
                        "hits": [
                        {"step": 0, "note": "C3", "steps": 16}
                        ],
                        "gain": -10.0,
                        "mute": False
                    }
                    }
                },
                "start_bar": 0,
                "repeat_times": 0
                },
                {
                "loop": {
                    "bars": 8,
                    "gain": 0.0,
                    "mute": False,
                    "tracks": {
                    "drums": {
                        "gen": {
                        "type": "sampler",
                        "filepath": "samples/drums/kick.mp3"
                        },
                        "hits": [
                        {"step": 0, "note": "C1", "steps": 1.0},
                        {"step": 8, "note": "C1", "steps": 1.0}
                        ],
                        "gain": -3.0,
                        "mute": False
                    },
                    "snare": {
                        "gen": {
                        "type": "sampler",
                        "filepath": "samples/drums/snare.mp3"
                        },
                        "hits": [
                        {"step": 4, "note": "D1", "steps": 1.0},
                        {"step": 12, "note": "D1", "steps": 1.0}
                        ],
                        "gain": -3.0,
                        "mute": False
                    },
                    "hihats": {
                        "gen": {
                        "type": "sampler",
                        "filepath": "samples/drums/hihat.mp3"
                        },
                        "hits": [
                        {"step": 2, "note": "E1", "steps": 0.5},
                        {"step": 6, "note": "E1", "steps": 0.5},
                        {"step": 10, "note": "E1", "steps": 0.5},
                        {"step": 14, "note": "E1", "steps": 0.5}
                        ],
                        "gain": -5.0,
                        "mute": False
                    },
                    "piano": {
                        "gen": {
                        "type": "piano",
                        "folderpath": "samples/piano/lofi_piano/"
                        },
                        "hits": [
                        {"step": 0, "note": "C4", "steps": 1.0},
                        {"step": 4, "note": "E4", "steps": 1.0},
                        {"step": 8, "note": "G4", "steps": 1.0},
                        {"step": 12, "note": "B3", "steps": 1.0}
                        ],
                        "gain": -5.0,
                        "mute": False
                    },
                    "synth": {
                        "gen": {
                        "type": "synth",
                        "waveform": "sine",
                        "ahdsr_envelope": {
                            "attack_ms": 200,
                            "hold_ms": 100,
                            "decay_ms": 300,
                            "sustain_level": 0.7,
                            "release_ms": 500
                        },
                        "amplitude": 0.8,
                        "sample_rate": 44100
                        },
                        "hits": [
                        {"step": 0, "note": "C3", "steps": 16}
                        ],
                        "gain": -10.0,
                        "mute": False
                    }
                    }
                },
                "start_bar": 4,
                "repeat_times": 1
                },
                {
                "loop": {
                    "bars": 4,
                    "gain": -5.0,
                    "mute": False,
                    "tracks": {
                    "piano": {
                        "gen": {
                        "type": "piano",
                        "folderpath": "samples/piano/lofi_piano/"
                        },
                        "hits": [
                        {"step": 0, "note": "C4", "steps": 1.0},
                        {"step": 4, "note": "E4", "steps": 1.0},
                        {"step": 8, "note": "G4", "steps": 1.0},
                        {"step": 12, "note": "B3", "steps": 1.0}
                        ],
                        "gain": -8.0,
                        "mute": False
                    },
                    "synth": {
                        "gen": {
                        "type": "synth",
                        "waveform": "sine",
                        "ahdsr_envelope": {
                            "attack_ms": 200,
                            "hold_ms": 100,
                            "decay_ms": 300,
                            "sustain_level": 0.7,
                            "release_ms": 500
                        },
                        "amplitude": 0.8,
                        "sample_rate": 44100
                        },
                        "hits": [
                        {"step": 0, "note": "C3", "steps": 16}
                        ],
                        "gain": -12.0,
                        "mute": False
                    }
                    }
                },
                "start_bar": 20,
                "repeat_times": 0
                }
            ]
        }
    if song_id not in song_store:
        raise HTTPException(status_code=404, detail='Song not found')
    song = song_store[song_id]
    if song_id in failed_songs:
        return {'id': song_id, 'status': 'failed'}
    if song is None:
        return {'id': song_id, 'status': 'pending'}
    return {'id': song_id, 'status': 'complete', 'result': song_to_json(song)}
    

@router.options('/song/mp3/{song_id}')
async def options_song_mp3(song_id: str = None):
    """OPTIONS request for CORS preflight"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "86400"
        }
    )

@router.head('/song/mp3/{song_id}')
async def head_song_mp3(song_id: str):
    """HEAD request for MP3 - returns headers without body"""
    if song_id == '0':
        return Response(
            status_code=200,
            headers={
                "Content-Type": "audio/mpeg",
                "Accept-Ranges": "bytes",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers": "*"
            }
        )

    if song_id not in song_store:
        raise HTTPException(status_code=404, detail='Song not found')
    song = cast(Song, song_store[song_id])
    if song is None:
        raise HTTPException(status_code=202, detail='Song still generating')

    return Response(
        status_code=200,
        headers={
            "Content-Type": "audio/mpeg",
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*"
        }
    )

@router.get('/song/mp3/{song_id}')
async def get_song_mp3(song_id: str, download: bool = False):
    if song_id == '0':
        return RedirectResponse(url="/beat-freestyle.mp3")
    if song_id not in song_store:
        raise HTTPException(status_code=404, detail='Song not found')
    song = cast(Song, song_store[song_id])
    if song is None:
        raise HTTPException(status_code=202, detail='Song still generating')

    audio = song.generate()
    buffer = BytesIO()

    try:
        audio.export(buffer, format='mp3')
        media_type = "audio/mpeg"
        filename = "sound.mp3"
    except FileNotFoundError:
        buffer = BytesIO()
        audio.export(buffer, format='wav')
        media_type = "audio/wav"
        filename = "sound.wav"

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type=media_type,
        headers={
            "Content-Disposition": f"inline; filename={filename}",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Accept-Ranges": "bytes"
        }
    )
