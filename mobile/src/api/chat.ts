import { apiJson } from './client';

export interface ChatThreadSummary {
  threadId: string;
  bookingId: string;
  otherUserName: string;
  otherUserId: string;
  role: 'CUSTOMER' | 'WORKER';
  requirementTitle: string;
  lastMessage?: string | null;
  lastMessageAt: string;
  unreadCount: number;
  workerType?: string | null;
  teamName?: string | null;
  teamSize?: number | null;
  tradeName?: string | null;
}

export interface ChatMessageView {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  sentAt: string;
  readByMe: boolean;
}

export interface ChatThreadDetail {
  threadId: string;
  bookingId: string;
  requirementTitle: string;
  otherUserName: string;
  myRole: string;
  workerType?: string | null;
  teamName?: string | null;
  teamSize?: number | null;
  tradeName?: string | null;
  messages: ChatMessageView[];
}

export async function getChatThreads(): Promise<ChatThreadSummary[]> {
  return apiJson<ChatThreadSummary[]>('/api/v1/chat/threads');
}

export async function openChatForBooking(
  bookingId: string,
): Promise<ChatThreadDetail> {
  return apiJson<ChatThreadDetail>(
    `/api/v1/chat/threads/booking/${bookingId}`,
    {
      method: 'POST',
    },
  );
}

export async function getChatThread(
  threadId: string,
): Promise<ChatThreadDetail> {
  return apiJson<ChatThreadDetail>(`/api/v1/chat/threads/${threadId}`);
}

export async function sendChatMessage(
  threadId: string,
  body: string,
  clientMessageId?: string,
): Promise<ChatMessageView> {
  return apiJson<ChatMessageView>(`/api/v1/chat/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, clientMessageId }),
  });
}
