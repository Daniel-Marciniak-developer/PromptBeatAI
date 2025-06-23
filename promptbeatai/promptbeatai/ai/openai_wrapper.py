import json
import jsonref
import openai
import os
from pathlib import Path
import re
from typing import cast

from promptbeatai.ai.core import GenerationPrompt
from promptbeatai.loopmaker.serialize import song_to_json


OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
SAMPLE_FOLDER = './assets/samples'
def list_files_and_folders(folder):
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
        merge_props=True
    )


song_schema = unroll_schema('./schemas/loopmaker/Song.schema.json')


# Suprisingly it works really well with gpt-4o, cost is ~2-3 cents per song
SYSTEM_PROMPT = f'''
You are a music composition assistant that creates structured musical pieces based on a user prompt and parameters like tempo, mood, and intensity. Your output must follow a two-step process:

1. **Sketch**: generate a verbose textual draft of the musical idea — describe its mood, instrumentation, musical scale and harmony, structure (e.g. intro-verse-chorus), and rhythm.
2. **Compose**: convert this sketch into a structured JSON format using a predefined schema representing musical tracks, notes, timing, and effects.

Always follow the user's intent, but make sure your composition is musically coherent and feasible for playback. Be creative, but stay within technical constraints of the schema.

Output only the final result (sketch + JSON) without explanation.

Specify notes for samples like kicks and hats as C5, it will be ignored by the sampler either way.

If steps in a hit is longer than the duration of the sample, it will play until its end.

Your song should be around 1-2 minutes in length.

When mixing, gain is additive, not multiplicative (ie default is 0.0).

If the user provides tempo, genre, instrument preferences, or other sliders, incorporate them. If not, choose sensible defaults. Please prefer the user's preferences, prompt, and settings when generating music.

Please wrap json clearly in Markdown tags, as used below.

You follow these schemas:
---

**Song**:
```json
{song_schema}
```

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
'''


client = openai.OpenAI(api_key=OPENAI_API_KEY)


def stringify_generation_prompt(prompt: GenerationPrompt) -> str:
    # TODO gpt-4o doesn't support sending in audio files through the API, but it may be possible with assistants
    s = ''
    if prompt['reference_composition']:
        s += '**Use the following composition as your reference**:\n'
        s += json.dumps(song_to_json(prompt['reference_composition']))
    if prompt['other_settings']:
        s += '**Users supplied these parameters**\n'
        s += '\n'.join(f'{k}: {v}' for k, v in prompt['other_settings'].items())
        s += '\n'
    s += "**This is the user's request**:\n{prompt['text_prompt']}\n"
    return s


def request_composition_draft(prompt: GenerationPrompt) -> str:
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': stringify_generation_prompt(prompt)}
        ],
        temperature=0.9
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


if __name__ == '__main__':
    print(SYSTEM_PROMPT)
    res = request_composition_draft(GenerationPrompt(
        text_prompt=input('User prompt:\n'),
        reference_composition=None,
        reference_sound=json.loads(input('Other settings (as JSON):\n')),
        other_settings={}
    ))
    print(res)
    json_res = json.dumps(extract_json_from_response(cast(str, res)))
    print(json_res)
