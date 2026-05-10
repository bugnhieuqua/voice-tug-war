import { useState, useEffect, useRef } from 'react';

export function useAudioVolume(active: boolean) {
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const volumeHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (!active) {
      setVolume(0);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      volumeHistoryRef.current = [];
      return;
    }

    let lastUpdateTime = performance.now();

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        if (ctx.state === 'suspended') {
           await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 512;
        
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          if (!analyserRef.current) return;
          
          analyserRef.current.getByteTimeDomainData(dataArray);
          
          // Calculate RMS
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          
          // Scale RMS to 0-100 (0.2 RMS is quite loud)
          let mappedVolume = Math.min(100, rms * 500);
          
          // Noise gate
          if (mappedVolume < 5) mappedVolume = 0;

          // Smoothing
          volumeHistoryRef.current.push(mappedVolume);
          if (volumeHistoryRef.current.length > 5) {
            volumeHistoryRef.current.shift();
          }
          const smoothed = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;

          const now = performance.now();
          if (now - lastUpdateTime > 40) { // Limit React state updates (~25fps)
            setVolume(smoothed);
            lastUpdateTime = now;
          }
          
          requestRef.current = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      } catch (err) {
        console.error("Microphone access denied or error", err);
      }
    };

    startAudio();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
      volumeHistoryRef.current = [];
    };
  }, [active]);

  return volume;
}
