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

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        streamRef.current = stream;
        
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        // Critical for mobile: resume context on user gesture (already within useEffect but helpful to be explicit)
        if (ctx.state === 'suspended') {
           await ctx.resume();
        }

        const analyser = ctx.createAnalyser();
        analyserRef.current = analyser;
        analyser.fftSize = 512; // Slightly higher for better RMS resolution
        analyser.smoothingTimeConstant = 0.4;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let lastUpdateTime = performance.now();

        const updateVolume = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteTimeDomainData(dataArray); // Use Time Domain for RMS
            
            // Calculate RMS (Root Mean Square) for more accurate volume
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const normalized = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
              sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);
            
            // Map RMS to 0-100. Typical RMS for speech is 0.01 to 0.2
            // We'll scale it so 0.15 is roughly 100
            let mappedVolume = Math.min(100, rms * 500); 
            
            // Apply noise gate
            if (mappedVolume < 5) mappedVolume = 0;

            // Simple weighted smoothing
            volumeHistoryRef.current.push(mappedVolume);
            if (volumeHistoryRef.current.length > 8) {
                volumeHistoryRef.current.shift();
            }
            const smoothed = volumeHistoryRef.current.reduce((a,b)=>a+b, 0) / volumeHistoryRef.current.length;

            const now = performance.now();
            if (now - lastUpdateTime > 40) { // ~25 FPS update for UI
               setVolume(smoothed);
               lastUpdateTime = now;
            }
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
