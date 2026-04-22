'use client';

import { useState, useEffect } from 'react';
import { useGetConversationsQuery } from '@/store/api/chatApi';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import { MessageSquare } from 'lucide-react';
import { useChatSocket } from '@/providers/ChatSocketProvider';
import { useTranslations } from 'next-intl';

export default function DoctorChatPage() {
  const t = useTranslations();
  const { data, isLoading, refetch } = useGetConversationsQuery({ viewerRole: 'doctor' });
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeOtherParty, setActiveOtherParty] = useState<any>(null);
  const { onConversationUpdated } = useChatSocket();

  useEffect(() => {
    const unsub = onConversationUpdated?.(() => {
      refetch();
    });
    return () => unsub?.();
  }, []);

  const handleSelect = (conversationId: string, otherParty: any) => {
    setActiveConversationId(conversationId);
    setActiveOtherParty(otherParty);
  };

  return (
    <div className="flex h-[calc(100vh-10rem)] rounded-2xl overflow-hidden border border-black/5 bg-white shadow-sm">
      <ConversationList
        conversations={data?.data || []}
        activeConversationId={activeConversationId}
        onSelect={handleSelect}
        isLoading={isLoading}
      />
      <div className="flex-1">
        {activeConversationId && activeOtherParty && user ? (
          <ChatWindow
            conversationId={activeConversationId}
            currentUser={{ id: (user as any)._id || (user as any).id, role: 'doctor', name: (user as any).name || 'Doctor' }}
            otherParty={activeOtherParty}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-black/[0.03] flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold font-heading text-text-primary">{t('chat.noConversations')}</h3>
            <p className="text-sm font-body text-text-muted mt-1.5 max-w-[200px]">
              {t('chat.startChat')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
