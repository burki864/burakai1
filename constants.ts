
import { Language, Personality, SettingsState } from './types';

export const DEFAULT_SETTINGS: SettingsState = {
  darkMode: true,
  language: Language.EN,
  showTimestamps: true,
  personality: Personality.Normal,
  creativity: 0.7,
  systemPrompt: 'You are BurakAI, a high-performance neural assistant powered by Gemini 3. You are helpful, precise, and respond with extreme speed.',
  searchEnabled: false,
  activeTheme: 'default'
};

export const MODELS = {
  text: 'gemini-3.1-pro-preview',
  image: 'gemini-3-pro-image-preview',
  video: 'veo-3.1-fast-generate-preview'
};

export const INTENT_KEYWORDS = {
  image: ['görsel oluştur', 'resim yap', 'create image', 'generate image', 'draw', 'çiz'],
  video: ['video yap', 'video oluştur', 'create video', 'generate video', 'make video', 'pika']
};

export const TRANSLATIONS: Record<Language, any> = {
  [Language.EN]: {
    nav: {
      chat: 'Neural Chat',
      images: 'Image Studio',
      videoStudio: 'Video Studio',
      settings: 'Parameters',
      downloads: 'Download App',
      history: 'History',
      newChat: 'New Link',
      proCore: 'Pro Core'
    },
    chat: {
      welcome: 'BurakAI Ultra',
      subtitle: 'Powered by Gemini 3 • Creative Vision • Neural Synthesis',
      init: 'Initiate Link',
      placeholder: 'Ask anything or use "/" for tools...',
      searchOn: 'Web Search Active',
      searchOff: 'Internal Logic Only',
      grounding: 'Sources',
      camera: 'Capture Node',
      upload: 'Attach Data',
      generating: 'Generating Art...',
      video: 'Synthesize Video',
      rateLimit: 'Wait 60s between video links.',
      features: [
        { title: 'Gemini Intelligence', desc: 'Advanced reasoning via Gemini 3.1 Pro' },
        { title: 'Vision Core', desc: 'Analyze images and videos with Multi-Modal AI' },
        { title: 'Veo Synth', desc: 'Generate high-quality neural motion clips' }
      ]
    },
    video: {
      title: 'Veo Cinematic',
      subtitle: 'Veo 3.1 Neural Engine • AI Motion Synthesis',
      placeholder: 'Describe your cinematic vision for Veo...',
      generate: 'Generate Video',
      empty: 'No Clips Synthesized',
      rateLimit: 'Cooling down... Wait 60s.'
    },
    images: { title: 'Neural Synthesis', subtitle: 'Artificially Imagined Reality', placeholder: 'Describe vision...', generate: 'Generate', generating: 'Synthesizing...', empty: 'No Art Found', emptySub: 'Initiate synthesis' },
    auth: { 
      login: 'Access Core', 
      signup: 'Register Core', 
      uplink: 'Secure Uplink', 
      email: 'Identifier', 
      password: 'Key', 
      initiate: 'Initiate', 
      secure: 'Secure', 
      multiNode: 'Multi-Node', 
      missing: 'No id?', 
      join: 'Join', 
      found: 'Id found?', 
      access: 'Access',
      nameTaken: 'This name is already taken'
    },
    banned: { title: 'PURGED', desc: 'Access restricted', device: 'Blocked', expires: 'Ends in: ', permanent: 'Permanent', reason: 'Violation Detail' },
    settings: { profile: 'Identity', profileSub: 'Neural footprint', theme: 'Environment', themeSub: 'Atmosphere', aiEngine: 'Engine', aiEngineSub: 'Model parameters', signOut: 'Sever Link', version: 'BurakAI v3.5.0-ultra' },
    downloads: {
      title: 'Get the App',
      subtitle: 'Multi-Node Synchronization',
      android: 'Android (APK)',
      windows: 'Windows (EXE)',
      apple: 'Apple (PWA)',
      pwaDesc: 'Open BurakAI in Safari and use "Add to Home Screen" to install.',
      apkDesc: 'Download the APK file for Android devices.',
      exeDesc: 'Desktop experience for Windows power users.',
      downloadNow: 'Download Now'
    }
  },
  [Language.TR]: {
    nav: {
      chat: 'Nöral Sohbet',
      images: 'Resim Stüdyosu',
      videoStudio: 'Video Stüdyosu',
      settings: 'Ayarlar',
      downloads: 'Uygulamayı İndir',
      history: 'Geçmiş',
      newChat: 'Yeni Bağlantı',
      proCore: 'Pro Çekirdek'
    },
    chat: {
      welcome: 'BurakAI Ultra',
      subtitle: 'Gemini 3 Altyapısı • Yaratıcı Vizyon • Nöral Sentez',
      init: 'Bağlantıyı Başlat',
      placeholder: 'Bir şey sorun veya "/" ile araçları görün...',
      searchOn: 'Web Araması Aktif',
      searchOff: 'Sadece Dahili Mantık',
      grounding: 'Kaynaklar',
      camera: 'Görüntü Yakala',
      upload: 'Veri Ekle',
      video: 'Video Sentezle',
      generating: 'Sanat Oluşturuluyor...',
      rateLimit: 'Videolar arası 60 saniye bekleyin.'
    },
    video: {
      title: 'Veo Sinematik',
      subtitle: 'Veo 3.1 Motoru • Yapay Zeka Hareket Sentezi',
      placeholder: 'Veo için sinematik vizyonunuzu tarif edin...',
      generate: 'Video Oluştur',
      empty: 'Sentezlenmiş Klip Yok',
      rateLimit: 'Soğuma süresi... 60 saniye bekleyin.'
    },
    images: { title: 'Nöral Sentez', subtitle: 'Yapay Hayal Gücü', placeholder: 'Vizyonunuz...', generate: 'Oluştur', generating: 'Sentezleniyor...', empty: 'Sanat Yok', emptySub: 'Sentezi başlat' },
    auth: { 
      login: 'Giriş', 
      signup: 'Kayıt', 
      uplink: 'Güvenli Bağlantı', 
      email: 'E-posta', 
      password: 'Şifre', 
      initiate: 'Başlat', 
      secure: 'Güvenli', 
      multiNode: 'Çoklu Düğüm', 
      missing: 'Hesap yok mu?', 
      join: 'Kayıt ol', 
      found: 'Hesap var mı?', 
      access: 'Giriş yap',
      nameTaken: 'Bu isim zaten alındı'
    },
    banned: { title: 'ENGELLEDİNİZ', desc: 'Erişim kısıtlandı', device: 'Cihaz Engellendi', expires: 'Bitiş: ', permanent: 'Kalıcı', reason: 'İhlal Detayı' },
    settings: { profile: 'Kimlik', theme: 'Çevresel Geçersiz Kılma', aiEngine: 'Bilişsel Motor', signOut: 'Bağlantıyı Kes', version: 'BurakAI v3.5.0-ultra' },
    downloads: {
      title: 'Uygulamayı Al',
      subtitle: 'Çoklu Düğüm Senkronizasyonu',
      android: 'Android (APK)',
      windows: 'Windows (EXE)',
      apple: 'Apple (PWA)',
      pwaDesc: 'Safari\'de BurakAI\'yi açın ve yüklemek için "Ana Ekrana Ekle"yi kullanın.',
      apkDesc: 'Android cihazger için APK dosyasını indirin.',
      exeDesc: 'Windows güç kullanıcıları için masaüstü deneyimi.',
      downloadNow: 'Şimdi İndir'
    }
  }
};
