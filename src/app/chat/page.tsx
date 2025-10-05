'use client';

import { ChatPage } from '@/components/chat/ChatPage';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui';

export default function ChatPageRoute() {
  const { setModal } = useUIStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <TopBar />
      <div className="pt-8">
        <ChatPage />
      </div>
    </div>
  );
}
