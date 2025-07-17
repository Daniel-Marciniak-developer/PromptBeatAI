from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi_proxiedheadersmiddleware import ProxiedHeadersMiddleware

from .middleware.rate_limiter import limiter
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

app.add_middleware(ProxiedHeadersMiddleware)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler) # type: ignore

app.include_router(generate_song_router)

@app.get('/health')
async def health_check():
    """Health check endpoint that shows which AI service is being used"""
    # Sprawdź zmienne środowiskowe bezpośrednio
    gemini_key = os.getenv('GEMINI_API_KEY', None)
    openai_key = os.getenv('OPENAI_API_KEY', None)

    ai_service = 'none'
    if gemini_key:
        ai_service = 'gemini'
    elif openai_key:
        ai_service = 'openai'

    return {
        'status': 'healthy',
        'ai_service': ai_service,
        'version': '1.0.0'
    }
