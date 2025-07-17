# 🎹 PromptBeat AI  

![screenshot of the PromptBeatAI service showing the main prompt text field and advanced settings](screenshot.png "PromptBeatAI")

**One prompt to a finished beat in seconds.**  
A colorful visualization of your track, intuitive sliders, and the ability to download your creations. No DAW required.

## How to run

### Web-app

Go to the [website](https://promptbeatai.ptaqqqq.hackclub.app).

### Locally

Update your `.env` with the following:

- `OPENAI_API_KEY` or `GEMINI_API_KEY` - only one of them is required
- `BACKEND_PORT` and `FRONTEND_PORT`
- `VITE_API_BASE_URL` - you will probably set this to `localhost:{BACKEND_PORT}`
- `ALLOWED_ORIGINS` with the origin address (if backend is on :8000 and frontend on :5173 it should be optional)

Set EXPOSE and CMD ports in `./Dockerfile` and `./frontend/project/Dockerfile`.

Then simply run:

`docker compose up --build`

<div align="center">
  <a href="https://shipwrecked.hackclub.com/?t=ghrm" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/739361f1d440b17fc9e2f74e49fc185d86cbec14_badge.png" 
         alt="This project is part of Shipwrecked, the world’s first hackathon on an island!" 
         style="width: 35%;">
  </a>
</div>
