from pathlib import Path
from promptbeatai.loopmaker.loopmaker.core import Hit, Loop, LoopInContext, Note, Song, Track
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
        'waveform': synth.waveform.value,
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
        'folderpath': str(piano.folderpath)
    }


def track_from_json(track_json: dict) -> Track:
    gen_json = track_json.get('gen', {})
    match gen_json.get('type').lower():
        case 'synth':
            gen = synth_from_json(gen_json)
        case 'sampler':
            gen = sampler_from_json(gen_json)
        case 'piano':
            gen = piano_from_json(gen_json)
    
    hits_json = track_json.get('hits', [])
    hits = []
    for hit_json in hits_json:
        note = hit_json.get('note', 'C5')
        if isinstance(note, str):
            note = Note.from_name(note)
        hit_json['note'] = note
        hits.append(Hit(**hit_json))

    gain = track_json.get('gain', 0.0)
    mute = track_json.get('mute', False)

    return Track(gen, hits, gain, mute)


def track_to_json(track: Track) -> dict:
    if isinstance(track.gen, SimpleSynth):
        gen_json = synth_to_json(track.gen)
        gen_json['type'] = 'synth'
    elif isinstance(track.gen, Sampler):
        gen_json = sampler_to_json(track.gen)
        gen_json['type'] = 'sampler'
    elif isinstance(track.gen, Piano):
        gen_json = piano_to_json(track.gen)
        gen_json['type'] = 'piano'
    else:
        raise ValueError(f"Unsupported generator type: {type(track.gen)}")
    return {
        'gen': gen_json,
        'hits': [{
                'step': h['step'],
                'note': h['note'].name,
                'steps': h['steps']
            } for h in track.hits],
        'gain': track.gain,
        'mute': track.mute
    }


def loop_from_json(loop_json: dict) -> Loop:
    loop = Loop()
    loop.bars = loop_json.get('bars', loop.bars)
    loop.gain = loop_json.get('gain', loop.gain)
    loop.mute = loop_json.get('mute', loop.mute)
    tracks = {}
    for track_name, track_json in loop_json.get('tracks', {}).items():
        tracks[track_name] = track_from_json(track_json)
    loop.tracks = tracks
    return loop


def loop_to_json(loop: Loop) -> dict:
    return {
        'bars': loop.bars,
        'gain': loop.gain,
        'mute': loop.mute,
        'tracks': {k: track_to_json(v) for k, v in loop.tracks.items()}
    }


def song_from_json(song_json: dict) -> Song:
    bpm = int(song_json.get('bpm', 0))
    song = Song(bpm)
    song.beats_per_bar = song_json.get('beats_per_bar', song.beats_per_bar)
    song.steps_per_beat = song_json.get('steps_per_beat', song.steps_per_beat)
    loops_in_context = []
    for lic_json in song_json.get('loops_in_context', []):
        loops_in_context.append(LoopInContext(**{
            'loop': loop_from_json(lic_json.get('loop')),
            'start_bar': lic_json.get('start_bar'),
            'repeat_times': lic_json.get('repeat_times', 1)
        }))
    song.loops_in_context = loops_in_context
    return song


def song_to_json(song: Song) -> dict:
    return {
        'bpm': song.bpm,
        'beats_per_bar': song.beats_per_bar,
        'steps_per_beat': song.steps_per_beat,
        'loops_in_context': [
            {'loop': loop_to_json(lic.loop),
             'start_bar': lic.start_bar,
             'repeat_times': lic.repeat_times
            } for lic in song.loops_in_context
        ]
    }
