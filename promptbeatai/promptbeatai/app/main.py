from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from .routers.generate_song import router as generate_song_router


logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title='PromptBeatAI API',
    description='Backend API for PromptBeatAI',
)

origins_env = os.getenv('ALLOWED_ORIGINS', None)
if origins_env:
    origins = [origin.strip().rstrip('/') for origin in origins_env.split(',')]
else:
    origins = [
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
    ]

logging.info(f"CORS origins configured: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(generate_song_router)
