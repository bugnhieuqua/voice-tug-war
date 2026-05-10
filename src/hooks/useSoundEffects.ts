import { useRef, useCallback } from 'react';

export function useSoundEffects() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol = 0.5) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    
    // Create nodes
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Configure
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    // Connect
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Play
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, [getAudioCtx]);

  const playCountdown = useCallback(() => {
    playTone(440, 'sine', 0.5); // A4
  }, [playTone]);

  const playGo = useCallback(() => {
    playTone(880, 'square', 0.8); // A5
  }, [playTone]);

  const playWin = useCallback(() => {
    // A simple arpeggio
    setTimeout(() => playTone(440, 'triangle', 0.4), 0);
    setTimeout(() => playTone(554.37, 'triangle', 0.4), 150);
    setTimeout(() => playTone(659.25, 'triangle', 0.4), 300);
    setTimeout(() => playTone(880, 'triangle', 0.8), 450);
  }, [playTone]);

  const playLose = useCallback(() => {
    setTimeout(() => playTone(440, 'sawtooth', 0.5), 0);
    setTimeout(() => playTone(415.30, 'sawtooth', 0.5), 300);
    setTimeout(() => playTone(392.00, 'sawtooth', 0.5), 600);
    setTimeout(() => playTone(349.23, 'sawtooth', 1.0), 900);
  }, [playTone]);

  return { playCountdown, playGo, playWin, playLose };
}

