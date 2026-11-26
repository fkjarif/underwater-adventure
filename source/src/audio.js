// ============================================================================
// audio: procedural underwater ambience + submersible propulsion
// ============================================================================
let AC, OUT, muted = false;
const VOL = 0.78;
function mkSound(ac) {
  const sr = ac.sampleRate;
  const N = (C, o, ...to) => { const n = new C(ac, o); for (const d of to) n.connect(d); if (n.start) n.start(); return n; };
  const G = (gain, ...to) => N(GainNode, { gain }, ...to);
  const BQ = (type, frequency, Q, ...to) => N(BiquadFilterNode, { type, frequency, Q }, ...to);
  const lfo = (frequency, depth, to) => N(OscillatorNode, { frequency }, G(depth, to));
  const noise = (secs, f) => { const n = sr * secs | 0, b = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: sr }); f(b.getChannelData(0), n); f(b.getChannelData(1), n); return b; };
  const nb = noise(11, (d, n) => { for (let i = 0, b = 0; i < n + 4096; i++) { b = (b + 0.02 * (rnd() * 2 - 1)) / 1.02; if (i < n) d[i] = b * 3.5; else { const k = (i - n) / 4096; d[i - n] = d[i - n] * k + b * 3.5 * (1 - k); } } });
  const ir = noise(5, (d, n) => { for (let i = 0, b = 0; i < n; i++) { const t = i / sr; b += (rnd() * 2 - 1 - b) * (0.04 + 0.5 * exp(-t * 2)); d[i] = b * (1 - exp(-t * 30)) * exp(-t * 1.5) * (1 - i / n); } });
  const lim = N(DynamicsCompressorNode, { threshold: -6, knee: 6, ratio: 20, attack: 0.003, release: 0.3 }, ac.destination);
  const out = OUT = G(0, lim), wet = N(ConvolverNode, { buffer: ir }, out);
  const src = (playbackRate, ...to) => N(AudioBufferSourceNode, { buffer: nb, loop: true, playbackRate }, ...to);
  const rum = G(0.34, out); src(1, BQ('lowpass', 150, 0.7, rum)); lfo(0.07, 0.11, rum.gain); lfo(0.113, 0.08, rum.gain);
  const wash = G(0.25, out), wave = G(1, wash), rush = G(0, out), rushF = BQ('bandpass', 300, 0.9, rush);
  src(0.63, BQ('bandpass', 420, 0.5, wave), rushF); lfo(0.09, 0.3, wave.gain); lfo(0.151, 0.25, wave.gain);
  const pad = G(1, out, G(1.5, wet));
  [73.42, 110, 164.81, 246.94, 369.99].forEach((f, i) => { const g = G(0.022 - i * 0.003, pad); N(OscillatorNode, { frequency: f }, g); N(OscillatorNode, { frequency: f + rr(0.03, 0.11) }, g); });
  const pool = (n, send, type) => Array.from({ length: n }, () => { const p = N(StereoPannerNode, {}, out, G(send, wet)), g = G(0, p); return { p, g, o: N(OscillatorNode, { type }, g) }; });
  const bub = pool(4, 0.12), chime = pool(3, 1.2), whale = pool(2, 2, 'triangle');
  const play = (vs, t, f0, f1, dur, vol, att) => {
    const v = vs.shift(), f = v.o.frequency, g = v.g.gain; vs.push(v);
    v.p.pan.setValueAtTime(rr(-0.7, 0.7), t);
    f.setValueAtTime(f0, t); f.exponentialRampToValueAtTime(f1, t + dur);
    g.setValueAtTime(0, t); g.linearRampToValueAtTime(vol, t + att); g.setTargetAtTime(0, t + att, (dur - att) / 5);
  };
  const NOTES = [0, 2, 5, 7, 9, 12, 14, 17, 19];
  // vehicle propulsion hum: low hum + thruster whoosh
  const humG = G(0, out), humOsc = N(OscillatorNode, { frequency: 55, type: 'sawtooth' }, BQ('lowpass', 280, 0.9, humG));
  const humOsc2 = N(OscillatorNode, { frequency: 110, type: 'triangle' }, G(0.18, humG));
  humG.gain.value = 0;
  const thrustG = G(0, BQ('bandpass', 180, 0.6, out));
  src(0.42, BQ('lowpass', 800, 0.7, thrustG));
  const boostG = G(0, BQ('highpass', 900, 0.5, out));
  src(1.8, BQ('bandpass', 1200, 0.4, boostG));

  let lt = ac.currentTime, tB = lt + 1.5, tC = lt + 5, tW = lt + 12, lx = subX, ly = subY, lz = subZ;
  out.gain.setTargetAtTime(VOL, lt, 1);
  return () => {
    const now = ac.currentTime, t = now + 0.05, dt = now - lt;
    if (dt <= 0) return;
    let v = hypot(subX - lx, subY - ly, subZ - lz) / dt; if (v > 60) v = 0;
    lt = now; lx = subX; ly = subY; lz = subZ;
    // vehicle audio reacts to speed
    const speed = subSpeed; // global set by physics
    const thr = clamp(speed / 14, 0, 1);
    humOsc.frequency.setTargetAtTime(42 + thr*38 + (boosting?22:0), t, 0.15);
    humOsc2.frequency.setTargetAtTime(80 + thr*55, t, 0.15);
    humG.gain.setTargetAtTime(thr*0.18 + (boosting?0.08:0), t, 0.12);
    thrustG.gain.setTargetAtTime(thr*0.22, t, 0.18);
    // wash/rush still follow camera depth
    rush.gain.setTargetAtTime(0.5 * pow(min(v / 26, 1), 1.2), t, 0.3); rushF.frequency.setTargetAtTime(220 + v * 14, t, 0.3);
    const s = clamp(1 + F[CY] / 30, 0, 1); wash.gain.setTargetAtTime(0.25 + 0.55 * s * s, t, 0.5);
    if (t > tB) { let tt = t; for (let n = 1 + rnd() * rnd() * 6 | 0; n--;) { const f = rr(380, 1300); play(bub, tt, f, f * rr(1.4, 2.2), 0.05 + 40 / f, rr(0.03, 0.08), 0.006); tt += rr(0.07, 0.2); } tB = tt + rr(0.5, 5); }
    if (t > tC) { const f = 440 * pow(2, NOTES[rnd() * 9 | 0] / 12); play(chime, t, f, f, 5, rr(0.02, 0.04), 0.03); tC = t + rr(2.5, 9); }
    if (t > tW) { let tt = t; for (let n = 2 + rnd() * 2 | 0; n--;) { const f = rr(170, 380), d = rr(1.6, 3.2); play(whale, tt, f, f * rr(0.6, 1.7), d, 0.08, d * 0.4); tt += d * 0.8; } tW = tt + rr(20, 50); }
    // sonar ping
    if (sonarPing > 0 && ac.currentTime > sonarNext) {
      const o = ac.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(900,t); o.frequency.exponentialRampToValueAtTime(300,t+0.9);
      const g = ac.createGain(); g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.9);
      const p = ac.createStereoPanner(); p.pan.value=0;
      o.connect(g).connect(p).connect(out); o.start(t); o.stop(t+1);
      sonarNext = t+1.2; sonarPing--;
    }
  };
}
let sonarPing=0, sonarNext=0;
function updateSoundUI(){ const b=document.getElementById('pmSound'); if(b) b.textContent='Sound: '+(muted?'Off':'On'); }
function sound() {
  if (!AC) { AC = new AudioContext({ latencyHint: 'playback' }); setInterval(mkSound(AC), 100); }
  if (AC.state === 'suspended' && !document.hidden) AC.resume();
}
const mute = () => { muted = !muted; if(OUT) OUT.gain.setTargetAtTime(muted ? 0 : VOL, AC.currentTime, 0.08); updateSoundUI(); };
const pingSonar = () => { if(!AC) sound(); sonarPing = 1; const s=document.getElementById('sonar'); if(s){ s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); setTimeout(()=>s.classList.remove('on'),1200); } };
document.addEventListener('visibilitychange', () => { if (AC) document.hidden ? AC.suspend() : AC.resume(); });
