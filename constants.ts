
import { Language, Personality, SettingsState } from './types';

export const DEFAULT_SETTINGS: SettingsState = {
  darkMode: true,
  language: Language.EN,
  showTimestamps: true,
  personality: Personality.Normal,
  creativity: 0.7,
  systemPrompt: 'You are BurakAI, a high-performance neural assistant powered by Groq. You are helpful, precise, and respond with extreme speed.',
  searchEnabled: false,
  activeTheme: 'default'
};

export const MODELS = {
  text: 'llama-3.3-70b-versatile',
  image: 'gemini-2.5-flash-image',
  video: 'pika-video-turbo'
};

export const INTENT_KEYWORDS = {
  image: ['görsel oluştur', 'resim yap', 'create image', 'generate image', 'draw', 'çiz'],
  video: ['video yap', 'video oluştur', 'create video', 'generate video', 'make video']
};

export const TRANSLATIONS: Record<Language, any> = {
  [Language.EN]: {
    nav: {
      chat: 'Neural Chat',
      images: 'Image Studio',
      videoStudio: 'Video Studio',
      settings: 'Parameters',
      history: 'History',
      newChat: 'New Link',
      proCore: 'Pro Core'
    },
    chat: {
      welcome: 'BurakAI Ultra',
      subtitle: 'Powered by Groq • Creative Vision • Neural Synthesis',
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
        { title: 'Groq Speed', desc: 'Instant responses via Llama 3.3 70B' },
        { title: 'Vision Core', desc: 'Analyze images with Llama 3.2 Vision' },
        { title: 'Video Synth', desc: 'Generate 1080p neural clips' }
      ]
    },
    video: {
      title: 'Cinematic Core',
      subtitle: 'Neural Video Engine • 1 clip / min',
      placeholder: 'Direct the neural engine...',
      generate: 'Synthesize',
      empty: 'No Clips Synthesized',
      rateLimit: 'Cooling down... Wait 60s.'
    },
    images: { title: 'Neural Synthesis', subtitle: 'Artificially Imagined Reality', placeholder: 'Describe vision...', generate: 'Generate', generating: 'Synthesizing...', empty: 'No Art Found', emptySub: 'Initiate synthesis' },
    auth: { login: 'Access Core', signup: 'Register Core', uplink: 'Secure Uplink', email: 'Identifier', password: 'Key', initiate: 'Initiate', secure: 'Secure', multiNode: 'Multi-Node', missing: 'No id?', join: 'Join', found: 'Id found?', access: 'Access' },
    banned: { title: 'PURGED', desc: 'Access restricted', device: 'Blocked', expires: 'Ends in: ', permanent: 'Permanent' },
    settings: { profile: 'Identity', profileSub: 'Neural footprint', theme: 'Environment', themeSub: 'Atmosphere', aiEngine: 'Engine', aiEngineSub: 'Model parameters', signOut: 'Sever Link', version: 'BurakAI v3.5.0-ultra' }
  },
  [Language.TR]: {
    nav: {
      chat: 'Nöral Sohbet',
      images: 'Resim Stüdyosu',
      videoStudio: 'Video Stüdyosu',
      settings: 'Ayarlar',
      history: 'Geçmiş',
      newChat: 'Yeni Bağlantı',
      proCore: 'Pro Çekirdek'
    },
    chat: {
      welcome: 'BurakAI Ultra',
      subtitle: 'Groq Altyapısı • Yaratıcı Vizyon • Nöral Sentez',
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
      title: 'Sinematik Çekirdek',
      subtitle: 'Nöral Video Motoru • 1 klip / dk',
      placeholder: 'Nöral motoru yönlendirin...',
      generate: 'Sentezle',
      empty: 'Sentezlenmiş Klip Yok',
      rateLimit: 'Soğuma süresi... 60 saniye bekleyin.'
    },
    images: { title: 'Nöral Sentez', subtitle: 'Yapay Hayal Gücü', placeholder: 'Vizyonunuz...', generate: 'Oluştur', generating: 'Sentezleniyor...', empty: 'Sanat Yok', emptySub: 'Sentezi başlat' },
    auth: { login: 'Giriş', signup: 'Kayıt', uplink: 'Güvenli Bağlantı', email: 'E-posta', password: 'Şifre', initiate: 'Başlat', secure: 'Güvenli', multiNode: 'Çoklu Düğüm', missing: 'Hesap yok mu?', join: 'Kayıt ol', found: 'Hesap var mı?', access: 'Giriş yap' },
    banned: { title: 'ENGELLEDİNİZ', desc: 'Erişim kısıtlandı', device: 'Cihaz Engellendi', expires: 'Bitiş: ', permanent: 'Kalıcı' },
    settings: { profile: 'Kimlik', theme: 'Çevresel Geçersiz Kılma', aiEngine: 'Bilişsel Motor', signOut: 'Bağlantıyı Kes', version: 'BurakAI v3.5.0-ultra' }
  }
};
