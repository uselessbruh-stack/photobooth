export type BoothSound = "enable" | "tap" | "menu" | "select" | "close" | "typing" | "tick" | "shutter" | "arrival" | "develop" | "printer" | "ready" | "download";
let enabled = false;
let context: AudioContext | null = null;
let master: GainNode | null = null;
let lastTyping = 0;

export function setBoothSound(enabledNext: boolean, announce = true) {
  enabled = enabledNext;
  if (master && context) master.gain.setValueAtTime(enabled ? .28 : 0, context.currentTime);
  if (enabled && announce) playBoothSound("enable");
}

export function playBoothSound(kind: BoothSound) {
  if (!enabled || typeof window === "undefined") return;
  if (kind === "typing" && performance.now() - lastTyping < 35) return;
  if (kind === "typing") lastTyping = performance.now();
  try {
    if (!context || context.state === "closed") {
      context = new AudioContext(); master = context.createGain();
      master.gain.value = .28; master.connect(context.destination);
    }
    const ctx = context, bus = master!;
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    function tone(frequency: number, offset: number, duration: number, volume = .2, end = frequency, type: OscillatorType = "triangle") {
      const oscillator = ctx.createOscillator(), gain = ctx.createGain(), start = ctx.currentTime + offset;
      oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, end), start + duration);
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(volume, start + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
      oscillator.connect(gain); gain.connect(bus); oscillator.start(start); oscillator.stop(start + duration + .01);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    switch (kind) {
      case "enable": tone(440, 0, .13); tone(660, .08, .18); break;
      case "menu": tone(330, 0, .09, .18, 490); tone(490, .045, .1, .12); break;
      case "select": tone(540, 0, .07); tone(810, .05, .13, .15); break;
      case "close": tone(390, 0, .09, .16, 240); break;
      case "typing": tone(240 + Math.random() * 70, 0, .035, .1, 100, "sine"); break;
      case "tick": tone(660, 0, .085, .18); break;
      case "shutter": {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * .12, ctx.sampleRate), samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * .018));
        const source = ctx.createBufferSource(), gain = ctx.createGain(); source.buffer = buffer;
        gain.gain.value = .38; source.connect(gain); gain.connect(bus); source.start();
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        tone(170, .035, .06, .2, 75, "square"); break;
      }
      case "arrival": tone(260, 0, .32, .14, 130); tone(520, .22, .24, .12); break;
      case "develop": [330, 440, 550].forEach((f, i) => tone(f, i * .13, .3, .08, f, "sine")); break;
      case "printer": for (let i = 0; i < 14; i++) tone(85 + (i % 2) * 22, i * .24, .18, .09, 65, "sawtooth"); break;
      case "ready": [523, 659, 784].forEach((f, i) => tone(f, i * .095, .27, .14)); break;
      case "download": tone(780, 0, .1); tone(520, .085, .12); tone(660, .17, .2); break;
      default: tone(260, 0, .055, .16, 150); break;
    }
  } catch { /* Audio availability never blocks the booth. */ }
}
