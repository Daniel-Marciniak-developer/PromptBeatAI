from pathlib import Path
from promptbeatai.loopmaker.loopmaker.core import Track
from promptbeatai.loopmaker.loopmaker.piano import Piano
from promptbeatai.loopmaker.loopmaker.sampler import Sampler
from promptbeatai.loopmaker.loopmaker.synth import SimpleSynth


def synth_from_json(synth_json: dict) -> SimpleSynth:
    waveform = synth_json['waveform']
    synth = SimpleSynth(waveform)
    ahdsr = synth_json.get('ahdsr_envelope', {})
    synth.ahdsr_envelope.attack_ms = ahdsr.get('attack_ms', synth.ahdsr_envelope.attack_ms)
    synth.ahdsr_envelope.hold_ms = ahdsr.get('hold_ms', synth.ahdsr_envelope.hold_ms)
    synth.ahdsr_envelope.decay_ms = ahdsr.get('decay_ms', synth.ahdsr_envelope.decay_ms)
    synth.ahdsr_envelope.release_ms = ahdsr.get('release_ms', synth.ahdsr_envelope.release_ms)
    synth.ahdsr_envelope.sustain_level = ahdsr.get('sustain_level', synth.ahdsr_envelope.sustain_level)
    synth.amplitude = synth_json.get('amplitude', synth.amplitude)
    synth.sample_rate = synth_json.get('sample_rate', synth.sample_rate)
    return synth


def synth_to_json(synth: SimpleSynth) -> dict:
    return {
        'type': 'synth',
        'waveform': synth.waveform,
        'ahdsr_envelope': {
            'attack_ms': synth.ahdsr_envelope.attack_ms,
            'hold_ms': synth.ahdsr_envelope.hold_ms,
            'decay_ms': synth.ahdsr_envelope.decay_ms,
            'release_ms': synth.ahdsr_envelope.release_ms,
            'sustain_level': synth.ahdsr_envelope.sustain_level
        },
        'amplitude': synth.amplitude,
        'sample_rate': synth.sample_rate
    }

def sampler_from_json(sampler_json: dict) -> Sampler:
    filepath = sampler_json.get('filepath')
    if filepath is None:
        raise ValueError("Missing 'filepath' in sampler_json")
    sampler = Sampler(Path(filepath))
    return sampler


def sampler_to_json(sampler: Sampler) -> dict:
    return {
        'type': 'sampler',
        'filepath': str(sampler.filepath)
    }
    

def piano_from_json(piano_json: dict) -> Piano:
    folderpath = piano_json.get('folderpath')
    if folderpath is None:
        raise ValueError("Missing 'folderpath' in piano_json")
    piano = Piano(Path(folderpath))
    return piano
    

def piano_to_json(piano: Piano) -> dict:
    return {
        'type': 'piano',
        'filepath': str(piano.folderpath)
    }
