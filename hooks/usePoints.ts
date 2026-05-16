import { useState, useEffect, useCallback } from 'react';

// 💰 Puan Maliyetleri (İstediğin Şekilde Güncellendi)
export const INITIAL_POINTS = 100;
export const COST_CHAT = 1;           // Chat: 1
export const COST_IMAGE = 5;          // Resim: 5
export const COST_WEBSITE = 10;       // Web Sitesi Oluşturma: 10

export const usePoints = () => {
  // Puanları LocalStorage'dan yükle
  const [points, setPoints] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_points');
      return saved !== null ? parseFloat(saved) : INITIAL_POINTS;
    }
    return INITIAL_POINTS;
  });

  // Günlük ödül tarihini yükle
  const [lastRewardDate, setLastRewardDate] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('last_reward_date');
    }
    return null;
  });

  // Puan her değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('user_points', points.toString());
  }, [points]);

  // Ödül tarihi her değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    if (lastRewardDate) {
      localStorage.setItem('last_reward_date', lastRewardDate);
    }
  }, [lastRewardDate]);

  // Puan yetiyor mu kontrolü
  const canSpend = useCallback((amount: number) => {
    return points >= amount;
  }, [points]);

  // Puan harcama fonksiyonu
  const spendPoints = useCallback((amount: number) => {
    if (canSpend(amount)) {
      setPoints(prev => Math.max(0, prev - amount)); // Negatife düşmemesi için önlem
      return true;
    }
    return false;
  }, [canSpend]);

  // Puan ekleme fonksiyonu
  const addPoints = useCallback((amount: number) => {
    setPoints(prev => prev + amount);
  }, []);

  // Bugün ödül alındı mı kontrolü
  const canClaimDaily = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return lastRewardDate !== today;
  }, [lastRewardDate]);

  // Günlük ödülü al
  const claimDaily = useCallback((amount: number) => {
    if (canClaimDaily()) {
      addPoints(amount);
      const today = new Date().toISOString().split('T')[0];
      setLastRewardDate(today);
      return true;
    }
    return false;
  }, [canClaimDaily, addPoints]);

  return {
    points,
    spendPoints,
    addPoints,
    canSpend,
    canClaimDaily,
    claimDaily,
    // Maliyetleri de dışarıya veriyoruz (UI'da göstermek istersen)
    costs: {
      chat: COST_CHAT,
      image: COST_IMAGE,
      website: COST_WEBSITE,
    }
  };
};
