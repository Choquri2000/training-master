"""Record the Georgian coach voice: one mp3 per phrase in voice/ka/phrases.json.

Uses the free Microsoft Edge neural voice for Georgian through the edge-tts package:
    pip install edge-tts
    python tools/make_voice_ka.py            # writes voice/ka/<hash>.mp3 and voice/ka/index.json
Run it again after adding phrases; existing clips are kept. The hash must match hashKa() in js/voice.js.
"""
import asyncio, json, os, sys

import edge_tts

VOICE = os.environ.get('KA_VOICE', 'ka-GE-GiorgiNeural')  # male coach; 'ka-GE-EkaNeural' is female
RATE = os.environ.get('KA_RATE', '+8%')
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'voice', 'ka')


def hash_ka(text):
    h = 0x811C9DC5
    data = text.encode('utf-16-le')
    for i in range(0, len(data), 2):
        h ^= data[i] | (data[i + 1] << 8)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return f'{h:08x}'


async def one(text, sem):
    path = os.path.join(OUT, hash_ka(text) + '.mp3')
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, VOICE, rate=RATE).save(path)
                return True
            except Exception as e:  # network hiccup: retry
                print('retry', attempt + 1, text, e, file=sys.stderr)
                await asyncio.sleep(2 * (attempt + 1))
    return False


async def main():
    phrases = json.load(open(os.path.join(OUT, 'phrases.json'), encoding='utf-8'))
    sem = asyncio.Semaphore(4)
    ok = await asyncio.gather(*(one(t, sem) for t in phrases))
    done = sorted({hash_ka(t) for t, good in zip(phrases, ok) if good})
    json.dump(done, open(os.path.join(OUT, 'index.json'), 'w'))
    print(f'{len(done)} of {len(phrases)} phrases recorded in {os.path.normpath(OUT)}')


asyncio.run(main())
