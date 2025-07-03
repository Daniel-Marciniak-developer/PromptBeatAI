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
                note = Note.from_name(note_name)
                self.samples[note] = AudioSegment.from_file(sample_file)

        if not self.samples:
            raise ValueError('No available samples to play')

    def _pitch_shift(self, requested_note: Note):
        # Find closest note
        min_dist = 1_000_000
        closest_note = None
        for avail_note in self.samples:
            dist = abs(requested_note.midi - avail_note.midi)
            if dist < min_dist:
                closest_note = avail_note
                min_dist = dist
        if closest_note is None:
            raise ValueError('No available sample to play!')
        # Pitch shift the closest sample to the requested note
        semitone_diff = requested_note.midi - closest_note.midi
        sample = self.samples[closest_note]
        octaves = semitone_diff / 12.0
        new_sample = sample._spawn(sample.raw_data, overrides={
            "frame_rate": int(sample.frame_rate * (2.0 ** octaves))
        }).set_frame_rate(sample.frame_rate)
        # TODO might cause issues in multithreaded context
        self.samples[requested_note] = new_sample
        
    def generate(self, note: Note, duration_ms: int):
        # TODO smooth clip-off if it ever becomes a problem
        if note not in self.samples:
            # Pitch shifting, yay!
            # OLD: raise ValueError(f'No sample found for note {note.name}')
            self._pitch_shift(note)

        sample = self.samples[note]
        # return cast(AudioSegment, sample[:duration_ms])
        return sample
