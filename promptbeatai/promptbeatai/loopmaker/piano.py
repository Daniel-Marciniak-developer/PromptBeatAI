from promptbeatai.loopmaker.core import Note, SoundGenerator
from pathlib import Path
from pydub import AudioSegment
from typing import cast, Dict


class Piano(SoundGenerator):
    def __init__(self, folderpath: Path):
        super().__init__()
        self.folderpath = folderpath
        self.samples: Dict[Note, AudioSegment] = {}

        for sample_file in self.folderpath.iterdir():
            if sample_file.is_file():
                note_name = sample_file.stem
                self.samples[Note.from_name(note_name)] = AudioSegment.from_file(sample_file)
        
    def generate(self, note: Note, duration_ms: int):
        # TODO: AHDSR envelope
        if note not in self.samples:
            raise ValueError(f'No sample found for note {note.name}')
        sample = self.samples[note]
        return cast(AudioSegment, sample[:duration_ms])
