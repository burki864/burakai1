import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { SettingsState, Message } from '../types';

interface VoiceSphereModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  onNewMessage?: (userText: string, assistantText: string) => void;
}

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export const VoiceSphereModal: React.FC<VoiceSphereModalProps> = ({
  isOpen,
  onClose,
  settings,
  onNewMessage
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState('');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioLevelRef = useRef<number>(0);
  const conversationHistoryRef = useRef<Message[]>([]);

  // Speech Recognition Kurulumu
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorNotice("Tarayıcınızda ses tanıma (SpeechRecognition) desteklenmiyor. Chrome veya Edge kullanmanız önerilir.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = settings.language === 'tr' ? 'tr-TR' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setVoiceState('listening');
      setErrorNotice(null);
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error !== 'no-speech') {
        setErrorNotice(`Mikrofon uyarısı: ${event.error}`);
      }
      if (voiceState === 'listening') {
        setVoiceState('idle');
      }
    };

    recognition.onend = () => {
      // Eğer kullanıcı bir şey söylediyse işleme başla
      if (transcript.trim() && voiceState === 'listening') {
        processUserVoice(transcript.trim());
      } else if (voiceState === 'listening' && !isMicMuted) {
        // Yeniden dinlemeye başla
        try {
          recognition.start();
        } catch (_) {}
      }
    };

    recognitionRef.current = recognition;

    if (!isMicMuted) {
      try {
        recognition.start();
      } catch (e) {
        console.warn(e);
      }
    }

    return () => {
      try {
        recognition.stop();
      } catch (_) {}
    };
  }, [isOpen, settings.language, isMicMuted]);

  // Sesli Konuşma İşleme
  const processUserVoice = async (userText: string) => {
    setVoiceState('thinking');
    setErrorNotice(null);

    const userMessage: Message = {
      id: `voice-u-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: Date.now()
    };
    conversationHistoryRef.current.push(userMessage);

    try {
      const response = await aiService.generateText(
        userText,
        conversationHistoryRef.current.slice(-4),
        settings
      );

      const cleanResponse = response.replace(/\[GENERATE:\s*\w+,\s*.*?\]/gi, '').trim();
      setLastAiResponse(cleanResponse);

      const assistantMessage: Message = {
        id: `voice-a-${Date.now()}`,
        role: 'assistant',
        content: cleanResponse,
        timestamp: Date.now()
      };
      conversationHistoryRef.current.push(assistantMessage);

      if (onNewMessage) {
        onNewMessage(userText, cleanResponse);
      }

      speakResponse(cleanResponse);
    } catch (err: any) {
      console.error("Voice processing error:", err);
      setErrorNotice(err.message || "Yapay zeka yanıt veremedi.");
      setVoiceState('idle');
    }
  };

  // Text-To-Speech (Yapay Zekanın Konuşması)
  const speakResponse = (text: string) => {
    if (isSpeakerMuted || !window.speechSynthesis) {
      setVoiceState('idle');
      return;
    }

    window.speechSynthesis.cancel();

    // Çok uzun metinleri kısaltarak seslendir (konuşma rahatlığı için ilk 2-3 cümle)
    const sentences = text.split(/(?<=[.?!])\s+/);
    const spokenText = sentences.slice(0, 3).join(' ') || text.slice(0, 200);

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = settings.language === 'tr' ? 'tr-TR' : 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Türkçe sesleri ara
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes(settings.language === 'tr' ? 'tr' : 'en'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setVoiceState('speaking');
    };

    utterance.onend = () => {
      setVoiceState('idle');
      setTranscript('');
      // AI konuşması bittiğinde tekrar kullanıcıyı dinlemeye başla
      if (!isMicMuted && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (_) {}
      }
    };

    utterance.onerror = () => {
      setVoiceState('idle');
    };

    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setVoiceState('idle');
  };

  // 3D AUDIO-REACTIVE SPHERE CANVAS ANİMASYONU
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    let angle = 0;
    const particleCount = 120;
    const particles: { x: number; y: number; z: number; size: number; baseSpeed: number }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const rad = 80 + Math.random() * 10;
      particles.push({
        x: rad * Math.sin(phi) * Math.cos(theta),
        y: rad * Math.sin(phi) * Math.sin(theta),
        z: rad * Math.cos(phi),
        size: 1.5 + Math.random() * 2,
        baseSpeed: 0.005 + Math.random() * 0.01
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // Duruma göre renkler ve enerji seviyesi
      let targetGlow = 0.3;
      let primaryColor = '#3b82f6';
      let secondaryColor = '#8b5cf6';
      let speedMultiplier = 1;

      if (voiceState === 'listening') {
        primaryColor = '#06b6d4'; // Cyan
        secondaryColor = '#3b82f6'; // Mavi
        targetGlow = 0.7 + Math.sin(Date.now() / 200) * 0.2;
        speedMultiplier = 1.2;
      } else if (voiceState === 'thinking') {
        primaryColor = '#a855f7'; // Mor
        secondaryColor = '#ec4899'; // Pembe
        targetGlow = 0.85;
        speedMultiplier = 2.5;
      } else if (voiceState === 'speaking') {
        primaryColor = '#3b82f6'; // Neon Mavi
        secondaryColor = '#10b981'; // Zümrüt Yeşili
        targetGlow = 0.9 + Math.sin(Date.now() / 100) * 0.3;
        speedMultiplier = 1.8;
      } else {
        // Idle
        targetGlow = 0.4 + Math.sin(Date.now() / 800) * 0.1;
        speedMultiplier = 0.7;
      }

      audioLevelRef.current += (targetGlow - audioLevelRef.current) * 0.1;
      const energy = audioLevelRef.current;

      angle += 0.01 * speedMultiplier;

      // 1. Arka Plan Neon Işıma Halosu (Glow Corona)
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 30,
        centerX, centerY, 160 * energy
      );
      gradient.addColorStop(0, primaryColor + '66');
      gradient.addColorStop(0.5, secondaryColor + '33');
      gradient.addColorStop(1, 'transparent');

      ctx.save();
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 180 * energy, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. İç Sıvı / Enerji Küresi Çemberleri
      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        ctx.save();
        ctx.beginPath();
        const baseRadius = 75 + w * 6;
        const waveAngle = angle + (w * Math.PI) / waveCount;

        for (let a = 0; a < Math.PI * 2; a += 0.1) {
          const distortion = Math.sin(a * 4 + waveAngle * 2) * (10 * energy) +
                             Math.cos(a * 6 - waveAngle) * (6 * energy);
          const r = baseRadius + distortion;
          const x = centerX + Math.cos(a) * r;
          const y = centerY + Math.sin(a) * r;

          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.strokeStyle = w % 2 === 0 ? primaryColor : secondaryColor;
        ctx.lineWidth = 2 + (energy * 1.5);
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 15 * energy;
        ctx.stroke();
        ctx.restore();
      }

      // 3. 3D Dönen Enerji Parçacıkları (Orbiting Particles)
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (let p of particles) {
        // Y ekseninde döndürme
        const rotX = p.x * cosA - p.z * sinA;
        const rotZ = p.x * sinA + p.z * cosA;

        // X ekseninde hafif eğik döndürme
        const rotY = p.y * Math.cos(0.4) - rotZ * Math.sin(0.4);
        const finalZ = p.y * Math.sin(0.4) + rotZ * Math.cos(0.4);

        const scale = 240 / (240 + finalZ);
        const projX = centerX + rotX * scale * (0.9 + energy * 0.2);
        const projY = centerY + rotY * scale * (0.9 + energy * 0.2);

        const alpha = Math.max(0.2, (finalZ + 100) / 200);

        ctx.save();
        ctx.fillStyle = finalZ > 0 ? primaryColor : secondaryColor;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(projX, projY, p.size * scale * (1 + energy * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Merkez Parlak Çekirdek (Core Singularity)
      const coreGrad = ctx.createRadialGradient(
        centerX, centerY, 5,
        centerX, centerY, 40
      );
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, primaryColor);
      coreGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 45 * energy, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, voiceState]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-2xl h-[640px] rounded-3xl border border-white/10 glass-panel overflow-hidden flex flex-col justify-between p-6 shadow-2xl"
          style={{ background: 'radial-gradient(circle at 50% 40%, rgba(30, 41, 59, 0.7) 0%, rgba(2, 6, 23, 0.95) 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Sparkles className="text-blue-400" size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-lg tracking-tight flex items-center gap-2">
                  BurakAI Canlı Küre Asistanı
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/30">
                    Live Neural
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {voiceState === 'listening' && '🎙️ Sizi dinliyor... Konuşun'}
                  {voiceState === 'thinking' && '⚡ BurakAI düşünüyor...'}
                  {voiceState === 'speaking' && '🔊 BurakAI yanıtlıyor...'}
                  {voiceState === 'idle' && 'Beklemede. Konuşmaya başlayabilirsiniz.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => { stopVoice(); onClose(); }}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Canvas Küre Alanı */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full max-w-[420px] max-h-[420px]" />

            {/* Hata Uyarısı Varsa */}
            {errorNotice && (
              <div className="absolute bottom-2 left-4 right-4 bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 text-center backdrop-blur-md">
                {errorNotice}
              </div>
            )}
          </div>

          {/* Konuşma & Altyazı Kartı */}
          <div className="space-y-4 z-10">
            <div className="min-h-[70px] max-h-[110px] overflow-y-auto px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-center flex flex-col items-center justify-center custom-scrollbar">
              {transcript ? (
                <p className="text-sm font-medium text-blue-300 italic">
                  "{transcript}"
                </p>
              ) : lastAiResponse ? (
                <p className="text-sm text-slate-200 line-clamp-3">
                  {lastAiResponse}
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Bir şey söyleyin, örneğin: "BurakAI bugün hava nasıl?" veya "Bana bir hikaye anlat"
                </p>
              )}
            </div>

            {/* Kontrol Butonları */}
            <div className="flex items-center justify-center gap-4">
              {/* Mikrofon Aç / Kapat */}
              <button
                onClick={() => {
                  const nextMute = !isMicMuted;
                  setIsMicMuted(nextMute);
                  if (nextMute) {
                    if (recognitionRef.current) recognitionRef.current.stop();
                    setVoiceState('idle');
                  } else {
                    if (recognitionRef.current) recognitionRef.current.start();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex items-center gap-2 ${
                  isMicMuted
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'bg-blue-600/30 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/20 hover:bg-blue-600/40'
                }`}
              >
                {isMicMuted ? <MicOff size={22} /> : <Mic size={22} className="animate-pulse" />}
                <span className="text-xs font-bold">{isMicMuted ? 'Mikrofon Kapalı' : 'Mikrofon Açık'}</span>
              </button>

              {/* Hoparlör Aç / Kapat */}
              <button
                onClick={() => {
                  setIsSpeakerMuted(!isSpeakerMuted);
                  if (!isSpeakerMuted && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    if (voiceState === 'speaking') setVoiceState('idle');
                  }
                }}
                className={`p-4 rounded-2xl border transition-all ${
                  isSpeakerMuted
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
                title="Ses Çıkışını Sustur / Aç"
              >
                {isSpeakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>

              {/* Manuel Gönder (Kullanıcı konuştuktan sonra beklemeden tetiklemek için) */}
              {transcript.trim() && voiceState !== 'thinking' && (
                <button
                  onClick={() => processUserVoice(transcript.trim())}
                  className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Send size={18} />
                  <span>Yanıtla</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VoiceSphereModal;
