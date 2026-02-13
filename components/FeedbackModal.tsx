
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Loader2, CheckCircle, ShieldAlert } from 'lucide-react';
import { feedbackService } from '../services/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const MotionDiv = motion.div as any;

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userName }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setError(null);
    try {
      await feedbackService.send(userName, message.trim());
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setMessage('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Transmission failed. Neural node unavailable.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal */}
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg glass-panel p-8 md:p-10 rounded-[3rem] border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tighter">Transmission</h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Feedback Link Active</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/20 animate-in zoom-in duration-500">
                  <CheckCircle size={48} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">Transmission Success</h3>
                  <p className="text-slate-500 font-bold">Your data has been logged into the core.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Command Content</label>
                  <textarea
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe improvements, bugs, or vision..."
                    className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-3xl p-6 text-white font-bold placeholder-slate-700 outline-none focus:border-blue-500 transition-all resize-none"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-300">
                    <ShieldAlert size={18} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                  {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  {isSending ? 'Transmitting...' : 'Send Feedback'}
                </button>
              </form>
            )}
          </MotionDiv>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
