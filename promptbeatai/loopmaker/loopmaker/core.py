from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import TypedDict
from pydub import AudioSegment


DEFAULT_NOTE = 'C5'

_NOTE_TO_SEMITONE = {
    'C': 0,  'C#': 1, 'Db': 1,
    'D': 2,  'D#': 3, 'Eb': 3,
    'E': 4,  'F': 5,  'F#': 6, 'Gb': 6,
    'G': 7,  'G#': 8, 'Ab': 8,
    'A': 9,  'A#': 10,'Bb': 10,
    'B': 11,
}

_SEMITONE_TO_NOTE = {v: k for k, v in _NOTE_TO_SEMITONE.items() if len(k) == 1 or '#' in k}


@dataclass
class Note:
    midi: int

    @classmethod
    def from_name(cls, name: str) -> 'Note':
        # parse like 'C#4' or 'Eb3'
        pitch, octave = name[:-1], int(name[-1])
        sem = _NOTE_TO_SEMITONE[pitch]
        midi = (octave + 1) * 12 + sem
        return cls(midi)    

    @property
    def name(self) -> str:
        sem = self.midi % 12
        octave = self.midi // 12 - 1
        note = _SEMITONE_TO_NOTE.get(sem, '?')
        return f'{note}{octave}'
    
    def transpose(self, semitones: int) -> 'Note':
        return Note(self.midi + semitones)


class SoundGenerator(ABC):
    @abstractmethod
    def generate(self, note: Note) -> AudioSegment:
        raise NotImplementedError
    
    def overlay_on_canvas(self, canvas: AudioSegment, note: Note, position_ms: int, gain: float = 0.0):
        canvas.overlay(self.generate(note).apply_gain(gain), position=position_ms)


class Hit(TypedDict):
    step: int
    note: Note


@dataclass
class Track:
    gen: SoundGenerator
    hits: list[Hit]
    gain: float = 0.0
    mute: bool = False

    def overlay_on_loop_canvas(self, canvas: AudioSegment, step_duration_ms: int):
        if self.mute:
            return
    
        for hit in self.hits:
            position_ms = int(hit['step'] * step_duration_ms)
            self.gen.overlay_on_canvas(canvas, hit['note'], position_ms, gain=self.gain)


class Loop:
    def __init__(self, bars: int = 4, gain: float = 0.0, mute: bool = False, steps_per_beat: int = 4):
        self.bars: int = bars
        self.steps_per_beat: int = steps_per_beat
        self.tracks: dict[str, Track] = {}
        self.gain: float = gain
        self.mute: bool = False

    def add_track(self, name: str, track: Track):
        self.tracks[name] = track

    def remove_track(self, name: str):
        self.tracks.pop(name)

    def generate(self, bpm: int, beats_per_bar: int = 4, steps_per_beat: int = 4) -> AudioSegment:
        step_duration_ms = int(60_000 / (bpm * self.steps_per_beat))
        total_steps = self.bars * beats_per_bar * steps_per_beat
        loop_duration_ms = int(total_steps * step_duration_ms)
        loop = AudioSegment.silent(duration=loop_duration_ms)

        for _, track in self.tracks.items():
            track.overlay_on_loop_canvas(loop, step_duration_ms)

        return loop
    
    def overlay_on_canvas(self, canvas: AudioSegment, position_ms: int, bpm: int, times: int = 1, beats_per_bar: int = 4, steps_per_beat: int = 4):
        if self.mute:
            return
        own_sound = self.generate(bpm, beats_per_bar, steps_per_beat).apply_gain(self.gain)
        canvas.overlay(own_sound, position=position_ms, times=times)
    


@dataclass
class LoopInContext:
    loop: Loop
    start_bar: int
    repeat_times: int = 1


class Song:
    def __init__(self, bpm: int, beats_per_bar: int = 4, steps_per_beat: int = 4):
        self.bpm = bpm
        self.beats_per_bar = beats_per_bar
        self.steps_per_beat = steps_per_beat
        self.loops_in_context: list[LoopInContext] = []

    def generate(self) -> AudioSegment:
        beat_duration_ms = int(60000 / self.bpm)
        bar_duration_ms = beat_duration_ms * self.beats_per_bar
        last_bar_excl = max([l.start_bar + l.loop.bars * l.repeat_times for l in self.loops_in_context])
        duration_ms = last_bar_excl * bar_duration_ms

        canvas = AudioSegment.silent(duration=duration_ms)

        for loop_in_context in self.loops_in_context:
            position_ms = loop_in_context.start_bar * bar_duration_ms
            loop_in_context.loop.overlay_on_canvas(
                canvas, 
                position_ms=position_ms,
                bpm=self.bpm,
                times=loop_in_context.repeat_times,
                beats_per_bar=self.beats_per_bar,
                steps_per_beat=self.steps_per_beat
            )

        return canvas
