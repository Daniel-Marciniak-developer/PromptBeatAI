from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .routers.generate_song import router as generate_song_router


app = FastAPI(
    title='PromptBeatAI API',
    description='Backend API for PromptBeatAI',
)

origins_env = os.getenv('ALLOWED_ORIGINS', None)
if origins_env:
    origins = [origin.strip() for origin in origins_env.split(',')]
else:
    origins = [
        'http://localhost',
        'http://localhost:3000',
        'http://127.0.0.1'
        'http://127.0.0.1:3000'
    ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(generate_song_router)
