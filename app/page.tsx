"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type Scene = {
  imageUrl: string;
  subtitle: string;
  durationMs: number;
  // Camera pan/zoom params
  zoomStart: number; // scale at start
  zoomEnd: number;   // scale at end
  panXStart: number; // -1..1 relative
  panXEnd: number;
  panYStart: number;
  panYEnd: number;
};

const SCENES: Scene[] = [
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Konark_Temple.JPG/1280px-Konark_Temple.JPG",
    subtitle:
      "I am the chief sthapati, leading the great wheel of Surya's chariot to rise from stone.",
    durationMs: 5000,
    zoomStart: 1.0,
    zoomEnd: 1.15,
    panXStart: -0.1,
    panXEnd: 0.1,
    panYStart: 0.0,
    panYEnd: 0.0
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Konark_Temple_-_Another_View.jpg/1280px-Konark_Temple_-_Another_View.jpg",
    subtitle:
      "Our craftsmen carve chlorite and khondalite, chisels singing as the sun crosses the sky.",
    durationMs: 5200,
    zoomStart: 1.05,
    zoomEnd: 1.2,
    panXStart: 0.0,
    panXEnd: 0.0,
    panYStart: -0.05,
    panYEnd: 0.05
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Konark_Sun_Temple_Front_View.jpg/1280px-Konark_Sun_Temple_Front_View.jpg",
    subtitle:
      "Twelve pairs of stone wheels mark the hours; each spoke a measure of time and devotion.",
    durationMs: 5200,
    zoomStart: 1.0,
    zoomEnd: 1.1,
    panXStart: -0.05,
    panXEnd: 0.05,
    panYStart: 0.02,
    panYEnd: -0.02
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Konark_Sun_Temple_Stone_Wheel.jpg/1280px-Konark_Sun_Temple_Stone_Wheel.jpg",
    subtitle:
      "Each wheel is a cosmos?axle, rim, and spokes aligned with the cycles of life.",
    durationMs: 5200,
    zoomStart: 1.1,
    zoomEnd: 1.2,
    panXStart: 0.05,
    panXEnd: -0.05,
    panYStart: 0.0,
    panYEnd: 0.0
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Konark_Sun_Temple_Sculptures.jpg/1280px-Konark_Sun_Temple_Sculptures.jpg",
    subtitle:
      "Dancers and musicians emerge from stone?ritual, rhythm, and the warmth of Surya.",
    durationMs: 5200,
    zoomStart: 1.0,
    zoomEnd: 1.12,
    panXStart: 0.0,
    panXEnd: 0.0,
    panYStart: 0.05,
    panYEnd: -0.05
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Konark_temple_ruins.JPG/1280px-Konark_temple_ruins.JPG",
    subtitle:
      "We raise the natamandira and jagamohana first; the sanctum will crown the journey.",
    durationMs: 5200,
    zoomStart: 1.0,
    zoomEnd: 1.1,
    panXStart: 0.05,
    panXEnd: -0.05,
    panYStart: 0.0,
    panYEnd: 0.0
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Konark_Sun_Temple_Wheel.jpg/1280px-Konark_Sun_Temple_Wheel.jpg",
    subtitle:
      "Iron clamps bind the blocks; hidden channels drain the monsoon?strength in every joint.",
    durationMs: 5200,
    zoomStart: 1.1,
    zoomEnd: 1.18,
    panXStart: -0.04,
    panXEnd: 0.04,
    panYStart: 0.02,
    panYEnd: -0.02
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Konark_Sun_Temple_Nataplan.jpg/1024px-Konark_Sun_Temple_Nataplan.jpg",
    subtitle:
      "Proportions follow shilpa shastra; each measure aligns with the course of the sun.",
    durationMs: 5200,
    zoomStart: 1.0,
    zoomEnd: 1.1,
    panXStart: 0.0,
    panXEnd: 0.0,
    panYStart: -0.03,
    panYEnd: 0.03
  },
  {
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Konark_Sun_Temple_Ruins.jpg/1280px-Konark_Sun_Temple_Ruins.jpg",
    subtitle:
      "As the chariot nears completion, we consecrate the space with light and mantra.",
    durationMs: 5200,
    zoomStart: 1.05,
    zoomEnd: 1.18,
    panXStart: 0.03,
    panXEnd: -0.03,
    panYStart: 0.0,
    panYEnd: 0.0
  }
];

function pickVoice(preferred: string[]): SpeechSynthesisVoice | null {
  const list = window.speechSynthesis.getVoices();
  for (const name of preferred) {
    const v = list.find((voice) => voice.name.toLowerCase().includes(name.toLowerCase()));
    if (v) return v;
  }
  return list.find((v) => /en|india|indian/i.test(`${v.name} ${v.lang}`)) || null;
}

function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.onvoiceschanged = update;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
  return voices;
}

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Preload images with CORS enabled for canvas safety.
  const images = useMemo(() => {
    return SCENES.map((scene) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      img.src = scene.imageUrl;
      return img;
    });
  }, []);

  const voices = useVoices();

  const totalDuration = useMemo(() => SCENES.reduce((a, s) => a + s.durationMs, 0), []);

  // Draw loop
  useEffect(() => {
    let raf = 0;
    let startTs = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1280; // fixed internal resolution
    const H = 720;
    canvas.width = W;
    canvas.height = H;

    function draw(now: number) {
      if (!startTs) startTs = now;
      const t = isPlaying ? now - startTs : Math.min(progress * totalDuration, totalDuration);

      // Determine active scene and local time
      let acc = 0;
      let sceneIndex = 0;
      for (let i = 0; i < SCENES.length; i++) {
        const d = SCENES[i].durationMs;
        if (t < acc + d) {
          sceneIndex = i;
          break;
        }
        acc += d;
      }
      const scene = SCENES[sceneIndex];
      const local = Math.min(Math.max(t - acc, 0), scene.durationMs);
      const p = scene.durationMs ? local / scene.durationMs : 0;

      // Clear
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, W, H);

      // Draw image with simple pan+zoom (Ken Burns)
      const img = images[sceneIndex];
      if (img && img.complete && img.naturalWidth > 0) {
        const scale = scene.zoomStart + (scene.zoomEnd - scene.zoomStart) * p;
        const panX = scene.panXStart + (scene.panXEnd - scene.panXStart) * p;
        const panY = scene.panYStart + (scene.panYEnd - scene.panYStart) * p;

        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const aspectImg = iw / ih;
        const aspectCanvas = W / H;

        let drawW = W * scale;
        let drawH = H * scale;
        if (aspectImg > aspectCanvas) {
          drawH = H * scale;
          drawW = drawH * aspectImg;
        } else {
          drawW = W * scale;
          drawH = drawW / aspectImg;
        }

        const centerX = W / 2 + panX * (W * 0.15);
        const centerY = H / 2 + panY * (H * 0.15);
        const dx = centerX - drawW / 2;
        const dy = centerY - drawH / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, dx, dy, drawW, drawH);
      }

      // Overlay gradient
      const grad = ctx.createLinearGradient(0, H * 0.65, 0, H);
      grad.addColorStop(0, 'rgba(0,0,0,0.0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      // Caption text
      ctx.fillStyle = '#fff';
      ctx.font = '24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
      ctx.textBaseline = 'bottom';
      const lines = wrapText(ctx, scene.subtitle, W - 48);
      let y = H - 24;
      for (let i = lines.length - 1; i >= 0; i--) {
        ctx.fillText(lines[i], 24, y);
        y -= 30;
      }

      // Progress bar
      const prog = Math.min(t / totalDuration, 1);
      setProgress(prog);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(24, H - 8, W - 48, 4);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(24, H - 8, (W - 48) * prog, 4);

      // Loop play
      if (isPlaying) {
        if (t >= totalDuration) {
          setIsPlaying(false);
        } else {
          raf = requestAnimationFrame(draw);
        }
      }
    }

    if (isPlaying) {
      startTs = performance.now() - progress * totalDuration;
      raf = requestAnimationFrame(draw);
    } else {
      // Draw a static frame at current progress
      draw(performance.now());
    }

    return () => cancelAnimationFrame(raf);
  }, [isPlaying, progress, images, totalDuration]);

  // Narration using Web Speech API
  useEffect(() => {
    if (!isPlaying) {
      window.speechSynthesis.cancel();
      return;
    }

    // Build combined narration text roughly aligned with scenes.
    const utterances: SpeechSynthesisUtterance[] = [];
    const preferred = [
      'Google UK English Male',
      'Microsoft Heera',
      'Microsoft Ravi',
      'Microsoft Prabhat',
      'Google ?????????',
      'English (India)'
    ];
    const voice = pickVoice(preferred) || undefined;

    SCENES.forEach((scene) => {
      const u = new SpeechSynthesisUtterance(scene.subtitle);
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.pitch = 1.0;
      u.volume = 1.0;
      utterances.push(u);
    });

    // Chain them sequentially to follow playback
    let index = 0;
    const speakNext = () => {
      if (!isPlaying) return;
      if (index >= utterances.length) return;
      const u = utterances[index++];
      window.speechSynthesis.speak(u);
      u.onend = () => speakNext();
    };

    // Small delay allows voices to settle
    const id = setTimeout(speakNext, 250);
    return () => {
      clearTimeout(id);
      utterances.forEach((u) => (u.onend = null));
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, voices]);

  function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth) {
        if (line) lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  const onPlay = () => {
    setError(null);
    setIsPlaying(true);
  };
  const onPause = () => setIsPlaying(false);
  const onRestart = () => {
    setIsPlaying(false);
    setProgress(0);
    setTimeout(() => setIsPlaying(true), 50);
  };

  const onExport = async () => {
    try {
      setError(null);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const stream = canvas.captureStream(30); // 30fps

      // Note: Capturing TTS audio is not supported reliably. This export will be silent.
      const options: MediaRecorderOptions = {
        mimeType: 'video/webm;codecs=vp9,opus'
      } as any;
      const recorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'konark_maker_story.webm';
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
      };

      setIsRecording(true);

      // Play from start and record full duration
      setIsPlaying(true);
      setProgress(0);
      recorder.start();

      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      setTimeout(() => {
        recorder.stop();
        setIsPlaying(false);
      }, SCENES.reduce((a, s) => a + s.durationMs, 0) + 250);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to export video');
      setIsRecording(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="title">Konark Sun Temple ? Maker\'s Story</h1>
          <p className="subtitle">An animated narration during construction, from the sthapati\'s perspective.</p>
        </div>
        <div className="controls">
          <button className="button" onClick={onPlay} disabled={isPlaying}>Play</button>
          <button className="button secondary" onClick={onPause} disabled={!isPlaying}>Pause</button>
          <button className="button" onClick={onRestart}>Restart</button>
          <button className="button" onClick={onExport} disabled={isRecording}>Export Silent WebM</button>
        </div>
      </div>

      <div className="canvasWrap">
        <canvas ref={canvasRef} className="canvas" />
        <div className="overlay">
          <div className="badgeRow">
            <span className="badge">720p Canvas</span>
            <span className="badge">Web Speech Narration</span>
            <span className="badge">Ken Burns Animation</span>
          </div>
          <p className="note">
            Tip: Click Play to hear narration (device volume on). Export produces a silent video
            due to browser limitations on capturing spoken audio.
          </p>
        </div>
      </div>

      {error && <p className="footer">Error: {error}</p>}
      {!error && (
        <p className="footer">
          Images courtesy of Wikimedia Commons. This experience runs entirely in your browser and is
          deployable on Vercel.
        </p>
      )}
    </div>
  );
}
