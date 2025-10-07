'use client';

import { useUIStore } from '@/stores/ui';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackModalWrapper() {
  const { modals, setModal } = useUIStore();
  
  return (
    <FeedbackModal
      isOpen={modals.feedback}
      onClose={() => setModal('feedback', false)}
    />
  );
}

