export interface UserMemory {
  preferences: {
    theme?: string;
    language?: string;
    expertise?: string; // Örn: "Senior Developer"
    interests?: string[];
  };
  keyFacts: string[]; // Kullanıcı hakkında kritik bilgiler: "Adı Burak", "React biliyor"
  lastInteraction: string;
  conversationCount: number;
}

const MEMORY_KEY = 'burakai_user_memory';

export const memoryStore = {
  // Hafızayı getir
  get: (userId: string): UserMemory => {
    if (typeof window === 'undefined') return memoryStore.getDefault();
    
    const saved = localStorage.getItem(`${MEMORY_KEY}_${userId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return memoryStore.getDefault();
  },

  // Hafızayı güncelle
  update: (userId: string, data: Partial<UserMemory>) => {
    const current = memoryStore.get(userId);
    const updated = {
      ...current,
      ...data,
      preferences: { ...current.preferences, ...data.preferences },
      lastInteraction: new Date().toISOString()
    };
    
    localStorage.setItem(`${MEMORY_KEY}_${userId}`, JSON.stringify(updated));
    console.log(`🧠 AI Memory Updated for ${userId}`);
  },

  // Yeni bir bilgi ekle (AI bir şey öğrendiğinde çağrılır)
  learnFact: (userId: string, fact: string) => {
    const current = memoryStore.get(userId);
    if (!current.keyFacts.includes(fact)) {
      const updatedFacts = [...current.keyFacts, fact].slice(-20); // Son 20 önemli bilgiyi tut
      memoryStore.update(userId, { keyFacts: updatedFacts });
    }
  },

  getDefault: (): UserMemory => ({
    preferences: { language: 'tr' },
    keyFacts: [],
    lastInteraction: new Date().toISOString(),
    conversationCount: 0
  })
};