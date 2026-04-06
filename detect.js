import onsetsFn from './onset.js'
import tempoFn from './tempo.js'

/**
 * Full beat detection pipeline: onsets → tempo → beat grid.
 *
 * @param {Float32Array} data - mono audio samples
 * @param {{fs?: number, frameSize?: number, hopSize?: number, minBpm?: number, maxBpm?: number}} params
 * @returns {{bpm: number, confidence: number, beats: Float64Array, onsets: Float64Array}}
 */
export default function detect(data, params) {
  let fs = params?.fs || 44100
  let ons = onsetsFn(data, params)
  let { bpm, confidence } = tempoFn(data, params)

  if (bpm <= 0 || !ons.length) return { bpm, confidence, beats: new Float64Array(0), onsets: ons }

  // build beat grid: snap onsets to nearest beat position
  let beatInterval = 60 / bpm
  let duration = data.length / fs

  // find best phase (offset) by testing alignment with onsets
  let bestPhase = 0, bestScore = -Infinity
  let nTest = Math.min(20, Math.ceil(beatInterval * fs / 512))
  for (let p = 0; p < nTest; p++) {
    let phase = (p / nTest) * beatInterval
    let score = 0
    for (let o of ons) {
      let dist = ((o - phase) % beatInterval + beatInterval) % beatInterval
      if (dist > beatInterval / 2) dist = beatInterval - dist
      score -= dist
    }
    if (score > bestScore) { bestScore = score; bestPhase = phase }
  }

  // generate beat grid
  let beats = []
  for (let t = bestPhase; t < duration; t += beatInterval) beats.push(t)

  return { bpm, confidence, beats: new Float64Array(beats), onsets: ons }
}
