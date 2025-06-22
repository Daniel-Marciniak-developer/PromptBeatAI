from promptbeatai.loopmaker.core import Note, SoundGenerator
from typing import cast
from pathlib import Path
from pydub import AudioSegment


class Sampler(SoundGenerator):
    def __init__(self, filepath: Path):
        super().__init__()
        self.filepath = filepath
        self.sound: AudioSegment = AudioSegment.from_file(self.filepath)

    def generate(self, note: Note, duration: int) -> AudioSegment:
        # PyDub doesn't have type annotations, this is a workaround
        return cast(AudioSegment, self.sound[:duration])

