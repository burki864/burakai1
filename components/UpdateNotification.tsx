import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, X, ArrowUpCircle, Bell } from 'lucide-react';

const LAST_BUILD_KEY = 'burakai_last_build_time';
const LAST_VERSION_KEY = 'burakai_last_version';

export interface VersionInfo {
  version: string;
  releaseDate: string;
  buildTime: number;
  commitSha?: string;
  changeLog?: string[];
}

export const UpdateNotification: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersionInfo, setNewVersionInfo] = useState<VersionInfo | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Bildirim izni isteme
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }
  };

  const checkForUpdates = async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) return;

      const data: VersionInfo = await res.json();
      const storedTime = localStorage.getItem(LAST_BUILD_KEY);
      const storedVersion = localStorage.getItem(LAST_VERSION_KEY);

      if (!storedTime || !storedVersion) {
        // İlk açılışta mevcut sürümü kaydet
        localStorage.setItem(LAST_BUILD_KEY, data.buildTime.toString());
        localStorage.setItem(LAST_VERSION_KEY, data.version);
        return;
      }

      // Yeni bir dağıtım (redeploy) tespit edildi
      const isNewBuild = data.buildTime > parseInt(storedTime, 10);
      const isNewVersion = data.version !== storedVersion;

      if (isNewBuild || isNewVersion) {
        setUpdateAvailable(true);
        setNewVersionInfo(data);

        // Native Android APK / PWA Bildirimi Gönder
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('🚀 BurakAI Güncellendi!', {
              body: `Yeni sürüm (${data.version}) yayında! Yenilikleri görmek için dokunun.`,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          } catch (e) {
            console.warn("Native bildirim hatası:", e);
          }
        }
      }
    } catch (err) {
      console.debug("Update check silent error:", err);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    checkForUpdates();

    // 45 saniyede bir veya sekme aktif olduğunda kontrol et
    const interval = setInterval(checkForUpdates, 45000);

    const handleFocus = () => {
      checkForUpdates();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleApplyUpdate = () => {
    setIsUpdating(true);
    if (newVersionInfo) {
      localStorage.setItem(LAST_BUILD_KEY, newVersionInfo.buildTime.toString());
      localStorage.setItem(LAST_VERSION_KEY, newVersionInfo.version);
    }

    // Service worker önbelleğini temizle ve yenile
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }

    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        className="fixed top-4 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-50 pointer-events-auto"
      >
        <div className="p-4 rounded-2xl glass-panel border border-blue-500/40 shadow-2xl bg-slate-900/90 backdrop-blur-2xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <ArrowUpCircle size={20} className="animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Yeni Güncelleme Yayında!
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                    {newVersionInfo?.version || 'v2.4.0'}
                  </span>
                </h4>
                <p className="text-xs text-slate-300">
                  Vercel redeploy tamamlandı. Yeni özellikler ve hata düzeltmeleri hazır.
                </p>
              </div>
            </div>

            <button
              onClick={() => setUpdateAvailable(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {newVersionInfo?.changeLog && newVersionInfo.changeLog.length > 0 && (
            <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-[11px] text-slate-300 space-y-1">
              {newVersionInfo.changeLog.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="text-blue-400">•</span>
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleApplyUpdate}
              disabled={isUpdating}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
            >
              <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
              <span>{isUpdating ? 'Güncelleniyor...' : 'Şimdi Yenile & Uygula'}</span>
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-semibold transition-all"
            >
              Daha Sonra
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotification;
