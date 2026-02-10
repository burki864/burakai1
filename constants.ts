
import { Language, Personality, SettingsState } from './types';

export const DEFAULT_SETTINGS: SettingsState = {
  darkMode: true,
  language: Language.EN,
  showTimestamps: true,
  personality: Personality.Normal,
  creativity: 0.7,
  systemPrompt: 'You are BurakAI, a highly intelligent and helpful AI assistant.'
};

export const MODELS = {
  text: 'gemini-3-flash-preview',
  image: 'gemini-2.5-flash-image'
};

export const SYSTEM_PROMPTS: Record<Personality, string> = {
  [Personality.Normal]: 'Provide clear, helpful, and professional answers.',
  [Personality.Funny]: 'Be witty, sarcastic, and humorous while still being helpful.',
  [Personality.Formal]: 'Use highly formal language, addressing the user with respect and providing detailed structured analysis.'
};

export const TRANSLATIONS: Record<Language, any> = {
  [Language.EN]: {
    nav: {
      chat: 'Neural Chat',
      images: 'Image Studio',
      settings: 'Parameters',
      history: 'Active History',
      newChat: 'New Transmission',
      proCore: 'Pro Core'
    },
    chat: {
      welcome: 'BurakAI Pro',
      subtitle: 'Next-gen reasoning engine powered by Gemini 3 Flash. Built for precision and scale.',
      init: 'Initialize Link',
      placeholder: 'Transmit signal to Neural Core...',
      uplink: 'Encrypted Uplink Active',
      node: 'Node: Gemini 3 Pro',
      typing: 'Synthesizing response...',
      scrollDown: 'Scroll to bottom',
      features: [
        { title: 'Cloud Logic', desc: 'Secure history via Supabase backend' },
        { title: 'Neural Core', desc: 'No-mock native SDK orchestration' },
        { title: 'Flash Stream', desc: 'Ultra-low latency inference speed' }
      ]
    },
    images: {
      title: 'Image Studio',
      subtitle: 'Neural engine • Gemini 2.5 Flash',
      placeholder: "Describe a cinematic masterpiece... e.g., 'Cyberpunk samurai in neon rain, hyper-realistic, 8k'",
      generate: 'Manifest',
      generating: 'Synthesizing...',
      empty: 'The Canvas is Empty',
      emptySub: 'Neural pathways awaiting instruction'
    },
    settings: {
      profile: 'Profile',
      profileSub: 'Manage your account information',
      aiEngine: 'AI Engine',
      aiEngineSub: 'Configure how BurakAI responds to you',
      personality: 'AI Personality',
      personalitySub: 'Choose the behavioral style of the AI',
      creativity: 'Creativity (Temperature)',
      creativitySub: 'Higher values produce more imaginative results',
      systemPrompt: 'System Prompt',
      preferences: 'Preferences',
      preferencesSub: 'Interface and localization',
      language: 'Language',
      appearance: 'Appearance',
      appearanceSub: 'Dark mode provides a better experience',
      timestamps: 'Show Timestamps',
      timestampsSub: 'Display the time for each message',
      signOut: 'Sign Out',
      deleteAcc: 'Delete Account',
      version: 'BurakAI Platform v1.0.4 • © 2025 BurakAI Technologies'
    },
    auth: {
      login: 'System Login',
      signup: 'Register Core',
      uplink: 'Neural Uplink Authorized',
      email: 'Terminal Email',
      password: 'Neural Cipher',
      initiate: 'Initiate Link',
      secure: 'Secure Core',
      missing: 'Identity Missing?',
      found: 'Link Found?',
      join: 'Join Neural Net',
      access: 'Access System',
      multiNode: 'Multi-Node'
    }
  },
  [Language.TR]: {
    nav: {
      chat: 'Nöral Sohbet',
      images: 'Görüntü Stüdyosu',
      settings: 'Parametreler',
      history: 'Aktif Geçmiş',
      newChat: 'Yeni İletim',
      proCore: 'Pro Çekirdek'
    },
    chat: {
      welcome: 'BurakAI Pro',
      subtitle: 'Gemini 3 Flash tarafından desteklenen yeni nesil muhakeme motoru. Hassasiyet ve ölçek için tasarlandı.',
      init: 'Bağlantıyı Başlat',
      placeholder: 'Nöral Çekirdeğe sinyal gönder...',
      uplink: 'Şifreli Bağlantı Aktif',
      node: 'Düğüm: Gemini 3 Pro',
      typing: 'Yanıt sentezleniyor...',
      scrollDown: 'Aşağı kaydır',
      features: [
        { title: 'Bulut Mantığı', desc: 'Supabase altyapısı ile güvenli geçmiş' },
        { title: 'Nöral Çekirdek', desc: 'Yerel SDK orkestrasyonu' },
        { title: 'Flash Akışı', desc: 'Ultra düşük gecikmeli çıkarım hızı' }
      ]
    },
    images: {
      title: 'Görüntü Stüdyosu',
      subtitle: 'Nöral motor • Gemini 2.5 Flash',
      placeholder: "Sinematik bir şaheser tanımlayın... örn: 'Neon yağmurunda siberpunk samuray, hiper-gerçekçi, 8k'",
      generate: 'Oluştur',
      generating: 'Sentezleniyor...',
      empty: 'Tuval Boş',
      emptySub: 'Nöral yollar talimat bekliyor'
    },
    settings: {
      profile: 'Profil',
      profileSub: 'Hesap bilgilerinizi yönetin',
      aiEngine: 'AI Motoru',
      aiEngineSub: "BurakAI'nın nasıl yanıt vereceğini yapılandırın",
      personality: 'AI Kişiliği',
      personalitySub: "AI'nın davranış stilini seçin",
      creativity: 'Yaratıcılık (Sıcaklık)',
      creativitySub: 'Daha yüksek değerler daha yaratıcı sonuçlar üretir',
      systemPrompt: 'Sistem Komutu',
      preferences: 'Tercihler',
      preferencesSub: 'Arayüz ve yerelleştirme',
      language: 'Dil',
      appearance: 'Görünüm',
      appearanceSub: 'Karanlık mod daha iyi bir deneyim sunar',
      timestamps: 'Zaman Damgaları',
      timestampsSub: 'Her mesaj için zamanı görüntüleyin',
      signOut: 'Oturumu Kapat',
      deleteAcc: 'Hesabı Sil',
      version: 'BurakAI Platformu v1.0.4 • © 2025 BurakAI Teknolojileri'
    },
    auth: {
      login: 'Sistem Girişi',
      signup: 'Çekirdek Kaydı',
      uplink: 'Nöral Bağlantı Yetkilendirildi',
      email: 'Terminal E-posta',
      password: 'Nöral Şifre',
      initiate: 'Bağlantıyı Başlat',
      secure: 'Çekirdeği Güvenceye Al',
      missing: 'Kimlik Eksik mi?',
      found: 'Bağlantı Bulundu mu?',
      join: 'Nöral Ağa Katıl',
      access: 'Sisteme Eriş',
      multiNode: 'Çoklu Düğüm'
    }
  }
};
