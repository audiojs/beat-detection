import test, { almost, ok, is } from 'tst'
import { detect, onsets, tempo } from './index.js'

let fs = 44100

// generate clicks at given BPM
function clicks(bpm, duration, sampleRate) {
  let n = Math.floor(duration * sampleRate)
  let d = new Float32Array(n)
  let interval = Math.floor(sampleRate * 60 / bpm)
  for (let i = 0; i < n; i += interval) {
    // short impulse
    for (let j = 0; j < 100 && i + j < n; j++) {
      d[i + j] = Math.exp(-j / 10) * (j % 2 ? -1 : 1)
    }
  }
  return d
}

function silence(n) { return new Float32Array(n) }

// --- Onset detection ---

test('onsets — detect click positions', () => {
  let data = clicks(120, 4, fs)
  let ons = onsets(data, { fs })
  ok(ons.length > 0, 'finds onsets')
  // 120 BPM for 4 seconds = ~8 beats
  ok(ons.length >= 4, 'enough onsets')
})

test('onsets — silence returns empty', () => {
  let ons = onsets(silence(fs * 2), { fs })
  is(ons.length, 0)
})

// --- Tempo ---

test('tempo — 120 BPM clicks', () => {
  let data = clicks(120, 8, fs)
  let result = tempo(data, { fs })
  ok(result.bpm > 0, 'detects tempo')
  almost(result.bpm, 120, 5)
})

test('tempo — 90 BPM clicks', () => {
  let data = clicks(90, 8, fs)
  let result = tempo(data, { fs })
  almost(result.bpm, 90, 5)
})

// --- Full detection ---

test('detect — 120 BPM full pipeline', () => {
  let data = clicks(120, 8, fs)
  let result = detect(data, { fs })
  ok(result.bpm > 0, 'detects BPM')
  almost(result.bpm, 120, 5)
  ok(result.beats.length > 0, 'has beat grid')
  ok(result.onsets.length > 0, 'has onsets')
})

test('detect — silence', () => {
  let result = detect(silence(fs * 2), { fs })
  is(result.beats.length, 0)
  is(result.onsets.length, 0)
})
