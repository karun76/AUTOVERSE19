import type { CarSpec } from '../data/cars';

export class EngineSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private primaryOsc: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private harmonicOsc: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private running = false;
  private revTimer: number | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.primaryOsc = this.ctx.createOscillator();
      this.subOsc = this.ctx.createOscillator();
      this.harmonicOsc = this.ctx.createOscillator();

      this.filter = this.ctx.createBiquadFilter();
      this.masterGain = this.ctx.createGain();

      this.primaryOsc.type = 'sawtooth';
      this.subOsc.type = 'triangle';
      this.harmonicOsc.type = 'sine';

      this.filter.type = 'lowpass';
      this.filter.frequency.value = 380;
      this.filter.Q.value = 2.4;

      this.masterGain.gain.value = 0;

      const subGain = this.ctx.createGain();
      subGain.gain.value = 0.55;

      const harmGain = this.ctx.createGain();
      harmGain.gain.value = 0.25;

      this.primaryOsc.connect(this.filter);
      this.subOsc.connect(subGain);
      subGain.connect(this.filter);
      this.harmonicOsc.connect(harmGain);
      harmGain.connect(this.filter);

      this.filter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.primaryOsc.start();
      this.subOsc.start();
      this.harmonicOsc.start();
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private getProfile(car?: CarSpec) {
    if (!car) return { baseDivisor: 22, waveform: 'sawtooth' as OscillatorType, filterBoost: 1 };
    const fuel = car.fuel.toLowerCase();
    const engine = car.engine.toLowerCase();

    if (fuel === 'electric') {
      return { baseDivisor: 10, waveform: 'sine' as OscillatorType, filterBoost: 1.5 };
    }
    if (engine.includes('v12') || engine.includes('v16') || engine.includes('v10')) {
      return { baseDivisor: 15, waveform: 'sawtooth' as OscillatorType, filterBoost: 1.35 };
    }
    if (engine.includes('v8')) {
      return { baseDivisor: 26, waveform: 'sawtooth' as OscillatorType, filterBoost: 0.9 };
    }
    return { baseDivisor: 20, waveform: 'sawtooth' as OscillatorType, filterBoost: 1.05 };
  }

  public start(rpm: number, car?: CarSpec) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || !this.primaryOsc) return;

    const profile = this.getProfile(car);
    this.primaryOsc.type = profile.waveform;
    this.running = true;
    this.masterGain.gain.setTargetAtTime(0.055, this.ctx.currentTime, 0.08);
    this.setRPM(rpm, car);
  }

  public setRPM(rpm: number, car?: CarSpec) {
    if (!this.ctx || !this.primaryOsc || !this.subOsc || !this.harmonicOsc || !this.filter) return;
    if (!this.running) return;

    const profile = this.getProfile(car);
    const safeRpm = Math.max(800, Math.min(8500, rpm));
    const baseFreq = safeRpm / profile.baseDivisor;
    const now = this.ctx.currentTime;

    this.primaryOsc.frequency.setTargetAtTime(baseFreq, now, 0.04);
    this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
    this.harmonicOsc.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.04);
    this.filter.frequency.setTargetAtTime((240 + safeRpm * 0.28) * profile.filterBoost, now, 0.05);
  }

  public blipRev(onRpmChange: (rpm: number) => void, car?: CarSpec) {
    if (this.revTimer !== null) {
      window.clearTimeout(this.revTimer);
      this.revTimer = null;
    }

    this.start(6400, car);
    onRpmChange(6400);

    this.revTimer = window.setTimeout(() => {
      if (!this.running) return;
      this.setRPM(1400, car);
      onRpmChange(1400);
      this.revTimer = null;
    }, 900);
  }

  public stop() {
    if (this.revTimer !== null) {
      window.clearTimeout(this.revTimer);
      this.revTimer = null;
    }
    this.running = false;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }
  }

  public dispose() {
    this.stop();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
