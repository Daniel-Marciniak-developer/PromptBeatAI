import json
import jsonref
import jsonschema
import logging
import openai
import os
from pathlib import Path
import re
from typing import cast

from promptbeatai.app.entities.generation_prompt import GenerationPrompt
from promptbeatai.loopmaker.serialize import song_from_json, song_to_json
from promptbeatai.loopmaker.core import Song


SAMPLE_FOLDER = os.getenv('SAMPLE_FOLDER', None)


def list_files_and_folders(folder):
    if SAMPLE_FOLDER is None:
        logging.warning('Sample folder not set!')
        return '', ''
    folder_path = Path(folder)
    files = []
    folders = []

    for p in folder_path.rglob('*'):
        rel_path = str(p.relative_to(folder_path))
        if p.is_file():
            files.append(rel_path)
        elif p.is_dir():
            # Only add folder if it has no subfolders
            if not any(child.is_dir() for child in p.iterdir()):
                folders.append(rel_path)

    files_str = '\n'.join(files)
    folders_str = '\n'.join(folders)
    return files_str, folders_str

files, folders = list_files_and_folders(SAMPLE_FOLDER)


def unroll_schema(path):
    with open(path) as f:
        raw = json.load(f)

    return jsonref.replace_refs(
        raw,
        base_uri=Path(path).absolute().as_uri(),
        merge_props=True,
        # load_on_repr=True
    )


def to_plain_dict(obj):
    if isinstance(obj, dict):
        return {k: to_plain_dict(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [to_plain_dict(i) for i in obj]
    elif hasattr(obj, '__dict__'):
        return to_plain_dict(vars(obj))
    else:
        return obj


song_schema = unroll_schema('./schemas/loopmaker/Song.schema.json')


# Suprisingly it works really well with gpt-4o, cost is ~2-3 cents per song
# FIXME song_schema is passed as str(dict), not json string
SYSTEM_PROMPT = f'''
You are a creative music producer that creates structured musical pieces based on a user prompt and parameters like tempo, mood, and intensity. Your output must follow a two-step process:

1. **Sketch**: generate a verbose textual draft of the musical idea — describe its mood, instrumentation, musical scale and harmony, structure (e.g. intro-verse-chorus), and rhythm. Write out melodies and chord progressions here as well. Please use different loops and vary the structure, so the song is actually interesting!

2. **Compose**: convert this sketch into a structured JSON format using a predefined schema representing musical tracks, notes, timing, and effects.

Always follow the user's intent, but make sure your composition is musically coherent and feasible for playback. Be creative, but stay within technical constraints of the schema.

Output only the final result (sketch + JSON) without explanation.

Specify notes for samples like kicks and hats as C5, it will be ignored by the sampler either way.

If steps in a hit is longer than the duration of the sample, it will play until its end.

Your song should be around 1-2 minutes in length.

When mixing, gain is additive, not multiplicative (ie default is 0.0).

If the user provides tempo, genre, instrument preferences, or other sliders, incorporate them. If not, choose sensible defaults. Please prefer the user's preferences, prompt, and settings when generating music.

**Note format is as follows: C5, F#3, etc. Use only this notation.**

Make each song approximately 32-64 bars in length.

Use around four loops for the song.

Make sure there aren't any silent spaces between loops.

Please wrap json clearly in Markdown tags, as used below.

You follow these schemas:
---

**Song**:
```json
{song_schema}
```

**Important**: If you want to generate a 1-bar loop that repeats for 8 bars, set bars to 1 and then repeat_times to 8.

**ALMOST ALWAYS DEFAULT TO "bars": 1 !!!***

**VERY IMPORTANT**: THIS JSON USES STEPS, NOT BEATS.
For example, if you want a four-to-the-floor pattern, you would fill steps 0, 4, 8, and 12 respectively (assuming steps_per_beat == 4).

---

Here is a list of samples you can use:
---

**Filepath**:
```
{files}
```

**Folderpath**:
```
{folders}
```

**USE ONLY THESE FILEPATHS AND FOLDERPATHS, AND NOTHING ELSE**

You can also use **BUILT-IN SYNTHS**, for example for 808 bass etc.
Use sine waveform usually, or triangle/sawtooth/square if the note range is from C4 and greater.

---

To recap, you should answer in two parts:
1. Composition draft
2. JSON *OBJECT* representing Song

**DO NOT CONFUSE OBJECT WITH SCHEMA!!!**

**REMEMBER TO WRITE OUT THE JSON**
'''
# The last line is very important


# TODO secure against prompt injection attacks
def stringify_generation_prompt(prompt: GenerationPrompt) -> str:
    # TODO gpt-4o doesn't support sending in audio files through the API, but it may be possible with assistants
    s = ''
    if prompt.reference_composition:
        s += '**Use the following composition as your reference**:\n'
        s += json.dumps(prompt.reference_composition)
        s += '\n'
    if prompt.other_settings:
        s += '**Users supplied these parameters**\n'
        s += '\n'.join(f'{k}: {v}' for k, v in prompt.other_settings.items())
        s += '\n'
    s += f"**This is the user's request**:\n{prompt.text_prompt}\n"
    return s


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
