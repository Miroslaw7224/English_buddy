'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          message: message.trim(),
          page_url: window.location.pathname,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "✅ Feedback wysłany",
        description: "Dziękujemy za zgłoszenie!",
        duration: 3000,
      });
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Feedback error:', error);
      toast({
        title: "❌ Błąd",
        description: "Nie udało się wysłać feedback",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/20 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">📝 Twój Feedback</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm mb-2">
              Opisz w skrócie zauważony problem:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="Np. Chat nie odpowiada po kliknięciu Wyślij..."
              maxLength={500}
              rows={6}
              className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="text-right text-xs text-gray-400 mt-1">
              {message.length}/500
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Wysyłanie...' : 'Wyślij'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

