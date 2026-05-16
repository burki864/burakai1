import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Target, Star } from 'lucide-react';

interface StarExplosionProps {
  onExplode: (points: number, type: string) => void;
  disabled?: boolean;
}

type AnimationStatus = 'idle' | 'fullscreen' | 'imploding' | 'exploding' | 'revealed';
type RewardType = 'blackhole' | 'neutron' | 'supernova' | 'merger_bh' | 'collision_ns';

const StarExplosion: React.FC<StarExplosionProps> = ({ onExplode, disabled }) => {
  const [status, setStatus] = useState<AnimationStatus>('idle');
  const [reward, setReward] = useState<{ points: number; type: RewardType; details: string } | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  // 🎲 Gelişmiş Ödül ve Olay Hesaplama Mantığı
  const calculateReward = (): { points: number; type: RewardType; details: string } => {
    const roll = Math.random();
    
    // 1️⃣ %1 ŞANS: SÜPER NADİR BİRLEŞMELER
    if (roll < 0.01) {
      const isBHMerger = Math.random() < 0.5;
      if (isBHMerger) {
        // İki Karadelik Birleşmesi (30-50) + (30-50) = 60-100 Puan
        const bh1 = Math.floor(Math.random() * 21) + 30;
        const bh2 = Math.floor(Math.random() * 21) + 30;
        return { 
          points: bh1 + bh2, 
          type: 'merger_bh', 
          details: `Kütleçekim Dalgaları Tespit Edildi: İki devasa karadelik birleşti! (${bh1}M☉ + ${bh2}M☉)`
        };
      } else {
        // İki Nötron Yıldızı Çarpışması (50-80) + (50-80) = 100-160 Puan (Kilonova)
        const ns1 = Math.floor(Math.random() * 31) + 50;
        const ns2 = Math.floor(Math.random() * 31) + 50;
        return { 
          points: ns1 + ns2, 
          type: 'collision_ns', 
          details: `Kilonova Patlaması! İki nötron yıldızı çarpışarak ağır elementler oluşturdu. (${ns1}M☉ + ${ns2}M☉)`
        };
      }
    }
    
    // 2️⃣ %9 ŞANS: NADİR OLAYLAR
    if (roll < 0.10) {
      const isSupernova = Math.random() < 0.3; // %10'un %30'u Supernova
      if (isSupernova) {
        return { points: Math.floor(Math.random() * 41) + 40, type: 'supernova', details: 'Tip II Süpernova Patlaması' }; // 40-80 Puan
      }
      return { points: Math.floor(Math.random() * 21) + 30, type: 'neutron', details: 'Genç bir nötron yıldızı keşfedildi.' }; // 30-50 Puan
    }
    
    // 3️⃣ %90 ŞANS: YAYGIN OLAYLAR
    return { points: Math.floor(Math.random() * 11) + 5, type: 'blackhole', details: 'Yıldız kütleli bir karadelik tespit edildi.' }; // 5-15 Puan
  };

  const startSequence = () => {
    if (disabled || status !== 'idle') return;
    setStatus('fullscreen');
  };

  const triggerExplosion = () => {
    if (status !== 'fullscreen') return;
    
    setStatus('imploding');
    const calculatedReward = calculateReward();
    setReward(calculatedReward);

    // Sequence: Implode (0.5s) -> Shake & Explode (0.1s) -> Reveal
    setTimeout(() => {
      // 🎥 KAMERA TİTREME EFEKTİNİ BAŞLAT
      if (calculatedReward.type.startsWith('merger') || calculatedReward.type.startsWith('collision') || calculatedReward.type === 'supernova') {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500); // Yarım saniye titre
      }
      
      setStatus('exploding');
      setTimeout(() => {
        setStatus('revealed');
        onExplode(calculatedReward.points, calculatedReward.type);
      }, 700); // Patlama animasyonu süresi
    }, 500); // Çökme animasyonu süresi
  };

  const reset = () => {
    if (status === 'revealed') {
      setStatus('idle');
      setReward(null);
    }
  };

  // 🎬 Titreme Animasyon Varyasyonları
  const shakeVariants = {
    shake: {
      x: [0, -20, 20, -15, 15, -10, 10, 0],
      y: [0, 15, -15, 10, -10, 5, -5, 0],
      transition: { duration: 0.5 }
    },
    noShake: { x: 0, y: 0 }
  };

  return (
    <>
      {/* Trigger Star (Small version) - Başlangıçta Beyaz Nokta */}
      <div className="relative flex items-center justify-center w-full h-48">
        <AnimatePresence>
          {status === 'idle' && (
            <motion.button
              whileHover={{ scale: 1.2, boxShadow: '0 0 40px rgba(255,255,255,0.6)' }}
              whileTap={{ scale: 0.8 }}
              onClick={startSequence}
              className="relative z-10"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ scale: 3, opacity: 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse relative overflow-hidden border-2 border-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,1),transparent)]" />
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-black text-white tracking-[0.3em] uppercase opacity-60">
                Gözlemle
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Animation Overlay */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#010206] flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={status === 'fullscreen' ? triggerExplosion : undefined}
          >
            {/*Stars Background */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              {[...Array(100)].map((_, i) => (
                <div key={i} className="absolute w-1 h-1 bg-white rounded-full animate-pulse" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }} />
              ))}
            </div>

            {status === 'revealed' && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); reset(); }} className="absolute top-8 right-8 p-4 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-colors z-[110]" >
                <X size={20} />
              </motion.button>
            )}

            {/* 🎥 KAMERA TİTREME KONTEYNERI */}
            <motion.div
              variants={shakeVariants}
              animate={isShaking ? "shake" : "noShake"}
              className="relative flex items-center justify-center w-full h-full"
            >
              {/* Main Object */}
              <div className="relative flex items-center justify-center">
                
                {/* 1. STATE: Başlangıç Yıldızı (Tam Ekran) */}
                {(status === 'fullscreen' || status === 'imploding') && (
                  <motion.div
                    animate={
                      status === 'fullscreen' ? { scale: [1, 1.1, 1], rotate: 360 } :
                      status === 'imploding' ? { scale: 0.05, rotate: 1080 } :
                      {}
                    }
                    transition={status === 'fullscreen' ? { duration: 20, repeat: Infinity, ease: "linear" } : { duration: 0.5, ease: "circIn" }}
                    className="relative z-10"
                  >
                    <div className="w-56 h-56 rounded-full bg-white shadow-[0_0_150px_rgba(255,255,255,1),0_0_80px_rgba(255,255,255,0.6)] relative overflow-hidden border-4 border-white">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,1),transparent)]" />
                    </div>
                    {status === 'fullscreen' && (
                        <div className="absolute inset-0 -m-8 rounded-full bg-white/10 blur-2xl animate-pulse" />
                    )}
                  </motion.div>
                )}

                {/* 2. STATE: Patlama Flaşı (Flaş Beyaz Olmalı) */}
                {status === 'exploding' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [1, 25, 30], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="absolute w-40 h-40 rounded-full bg-white shadow-[0_0_300px_50px_rgba(255,255,255,1)] z-50"
                  />
                )}

                {/* 3. STATE: SONUÇ (Nadir Olay Grafikleri) */}
                {status === 'revealed' && reward && (
                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 15 }} className="relative z-10 flex flex-col items-center gap-8" >
                    
                    {/* Görsel Bölüm */}
                    <div className="relative flex items-center justify-center">
                      
                      {/* NADİR BİRLEŞME EFEKTLERİ */}
                      {(reward.type === 'merger_bh' || reward.type === 'collision_ns') && (
                          <div className="absolute inset-0 flex items-center justify-center">
                              {/* Kütleçekim Dalgaları (Halkalar) */}
                              {[...Array(4)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: [0, 0.5, 0], scale: [0.8, 2.5, 3] }}
                                    transition={{ duration: 3, delay: i * 0.7, repeat: Infinity, ease: "easeOut" }}
                                    className={`absolute rounded-full border-4 ${reward.type === 'merger_bh' ? 'border-orange-500/40' : 'border-blue-400/40'} blur-sm`}
                                    style={{ width: '150px', height: '150px' }}
                                  />
                              ))}
                              {/* Çarpışma Işığı */}
                              <div className={`w-32 h-32 rounded-full blur-2xl animate-pulse ${reward.type === 'merger_bh' ? 'bg-orange-600/50' : 'bg-white/70'}`} />
                          </div>
                      )}

                      {/* Element Grafikleri (İki tane birleşen veya tek) */}
                      <div className="relative flex items-center gap-4 z-20">
                          {reward.type === 'merger_bh' || reward.type === 'collision_ns' ? (
                              <>
                                  <ElementGraphic type={reward.type === 'merger_bh' ? 'blackhole' : 'neutron'} scale={0.8} />
                                  <div className="text-5xl font-black text-white animate-pulse">×</div>
                                  <ElementGraphic type={reward.type === 'merger_bh' ? 'blackhole' : 'neutron'} scale={0.8} />
                              </>
                          ) : (
                              <ElementGraphic type={reward.type} scale={1} />
                          )}
                      </div>
                    </div>

                    {/* Bilgi Bölümü */}
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center flex flex-col items-center gap-5 p-8 rounded-3xl bg-black/50 border border-white/5 backdrop-blur-xl shadow-2xl" >
                      <div className="flex flex-col items-center gap-1">
                        <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full ${reward.type.startsWith('merger') || reward.type.startsWith('collision') ? 'bg-red-950 border border-red-500/50 text-red-400' : 'bg-white/5 border border-white/10 text-white/50' }`}>
                            {reward.type.startsWith('merger') || reward.type.startsWith('collision') ? <Target size={14} className="animate-pulse" /> : <Star size={14} />}
                            <span className="font-bold uppercase tracking-[0.3em] text-[10px]">
                                {reward.type === 'merger_bh' ? 'Kritik Kütleçekim Olayı' : 
                                 reward.type === 'collision_ns' ? 'Kilonova Patlaması' : 
                                 reward.type === 'supernova' ? 'Süpernova' : 
                                 'Keşif Başarılı'}
                            </span>
                        </div>
                        <h3 className={`text-5xl font-black tracking-tighter ${reward.type === 'neutron' || reward.type === 'collision_ns' || reward.type === 'supernova' ? 'text-white' : 'text-orange-500'} ${reward.type.startsWith('merger') || reward.type.startsWith('collision') ? 'italic' : ''}`}>
                          {reward.type === 'neutron' ? 'NÖTRON YILDIZI' : 
                           reward.type === 'blackhole' ? 'KARADELİK' : 
                           reward.type === 'supernova' ? 'SÜPERNOVA' : 
                           reward.type === 'merger_bh' ? 'KARADELİK BİRLEŞMESİ' : 
                           'NÖTRON ÇARPIŞMASI'}
                        </h3>
                        <p className="max-w-md text-white/60 font-medium text-sm leading-relaxed mt-2">{reward.details}</p>
                      </div>
                      
                      <div className="relative group">
                          <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition" />
                          <div className="relative px-12 py-5 rounded-3xl bg-black/60 border border-yellow-500/20 backdrop-blur-md">
                            <span className="text-5xl font-black text-yellow-500 tracking-tighter">+{reward.points} PUAN</span>
                          </div>
                      </div>

                      <button onClick={(e) => { e.stopPropagation(); reset(); }} className="mt-6 px-12 py-4.5 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors flex items-center gap-3 active:scale-95" >
                        <Zap size={18} /> Koleksiyona Ekle
                      </button>
                    </motion.div>
                  </motion.div>
                )}

                {/* Interaction Overlay (Fullscreen) */}
                {status === 'fullscreen' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-20 pointer-events-none" >
                    <p className="text-white font-black text-sm uppercase tracking-[0.5em] animate-pulse"> Patlatmak için dokun </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// 🌟 Tipine göre Element Grafiği Çizen Yardımcı Bileşen
const ElementGraphic: React.FC<{ type: RewardType; scale: number }> = ({ type, scale }) => {
    const size = 64 * scale;
    if (type === 'blackhole' || type === 'merger_bh') {
        return (
          <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border-[10px] border-orange-500/30 blur-sm scale-125" />
            <div className="absolute inset-2 rounded-full bg-black shadow-[0_0_40px_rgba(255,165,0,0.5)] z-20 border border-orange-900" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-600 via-transparent to-orange-600 opacity-40 blur-xl animate-pulse" />
          </div>
        );
    }
    if (type === 'neutron' || type === 'collision_ns') {
        return (
          <div className="relative flex items-center justify-center" style={{ width: `${size}px`, height: `${size}px` }}>
            <div className="w-16 h-16 rounded-full bg-white shadow-[0_0_50px_rgba(255,255,255,1),0_0_100px_rgba(59,130,246,0.6)] z-20 relative overflow-hidden border-2 border-blue-100">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-400 opacity-50" />
            </div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} className="absolute w-[400px] h-1.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent blur-sm opacity-60" style={{ scale }} />
          </div>
        );
    }
    if (type === 'supernova') {
        return (
            <div className="relative flex items-center justify-center" style={{ width: `${size}px`, height: `${size}px` }}>
                <div className="absolute inset-0 rounded-full bg-red-600 blur-3xl animate-pulse opacity-50" />
                <div className="w-20 h-20 rounded-full bg-white shadow-[0_0_80px_rgba(255,255,255,1)] z-20 border-4 border-white" />
                {[...Array(12)].map((_, i) => (
                    <motion.div key={i} animate={{ x: (Math.random()-0.5)*300, y:(Math.random()-0.5)*300, opacity: 0 }} transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }} className="absolute w-2 h-2 bg-yellow-400 rounded-full" />
                ))}
            </div>
        )
    }
    return null;
}

export default StarExplosion;