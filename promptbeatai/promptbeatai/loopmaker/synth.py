from promptbeatai.loopmaker.core import Note, SoundGenerator
from dataclasses import dataclass
from enum import Enum
from pydub import AudioSegment
from typing import Union
import numpy as np
from scipy.signal import square, sawtooth


class Waveform(Enum):
    SINE = "sine"
    SQUARE = "square"
    SAWTOOTH = "sawtooth"
    TRIANGLE = "triangle"
    

@dataclass
class AHDSREnvelope:
    attack_ms: int = 0
    hold_ms: int = 0
    decay_ms: int = 0
    sustain_level: float = 1.0
    release_ms: int = 0



class SimpleSynth(SoundGenerator):
    def __init__(self, waveform: Union[Waveform, str], ahdsr_envelope: AHDSREnvelope = AHDSREnvelope(), amplitude: float = 0.5, sample_rate: int = 44100):
        super().__init__()

        if isinstance(waveform, str):
            try:
                waveform = Waveform(waveform.lower())
            except ValueError:
                raise ValueError(f'Invalid waveform: {waveform}')
            
        self.waveform = waveform
        self.ahdsr_envelope = ahdsr_envelope
        self.amplitude = amplitude
        self.sample_rate = sample_rate

    def generate(self, note: Note, duration_ms: int) -> AudioSegment:
        r = int(self.sample_rate * self.ahdsr_envelope.release_ms / 1000)
        note_samples = int(self.sample_rate * duration_ms / 1000)
        t = np.linspace(0, duration_ms / 1000, note_samples + r, False)
        freq = note.to_frequency()
        angle = 2 * np.pi * freq * t

        match self.waveform:
            case Waveform.SINE:
                wave = np.sin(angle)
            case Waveform.SQUARE:
                wave = square(angle)
            case Waveform.SAWTOOTH:
                wave = sawtooth(angle)
            case Waveform.TRIANGLE:
                # width is incorrectly typed as int
                wave = sawtooth(angle, width=0.5) # type: ignore
        
        a = int(self.sample_rate * self.ahdsr_envelope.attack_ms / 1000)
        h = int(self.sample_rate * self.ahdsr_envelope.hold_ms / 1000)
        d = int(self.sample_rate * self.ahdsr_envelope.decay_ms / 1000)
        s = max(note_samples - (a + h + d), 0)

        env_parts = []
        # attack: 0 -> 1
        if a > 0:
            env_parts.append(np.linspace(0, 1, a, False))
        # hold: flat at 1
        if h > 0:
            env_parts.append(np.ones(h))
        # decay: 1 -> sustain
        if d > 0:
            env_parts.append(np.linspace(1, self.ahdsr_envelope.sustain_level, d, False))
        # sustain - only if there is enough space; if a, h, d = 0 everything will be sustain
        if s > 0:
            env_parts.append(np.ones(s) * self.ahdsr_envelope.sustain_level)

        # clip if needed
        env = np.concatenate(env_parts)[:note_samples]

        # release: last value -> 0
        release_start = env[-1]
        if r > 0:
            env = np.concatenate([env, np.linspace(release_start, 0, r, False)])



        waveform = wave * self.amplitude * env
        audio_data = np.int16(waveform * 32767)

        return AudioSegment(
            audio_data.tobytes(),
            frame_rate=self.sample_rate,
            sample_width=2,
            channels=1
        )
