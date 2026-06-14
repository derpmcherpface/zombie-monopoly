let context: AudioContext | null = null;

export function playSound(kind: "roll" | "coin" | "doom", muted: boolean) {
  if (muted) return;
  context ??= new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  const now = context.currentTime;
  oscillator.type = kind === "doom" ? "sawtooth" : "triangle";
  oscillator.frequency.setValueAtTime(kind === "roll" ? 180 : kind === "coin" ? 560 : 90, now);
  oscillator.frequency.exponentialRampToValueAtTime(kind === "coin" ? 920 : 120, now + 0.12);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
  oscillator.start(now);
  oscillator.stop(now + 0.17);
}
