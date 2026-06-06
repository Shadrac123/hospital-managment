import { ref, push, set, onValue, serverTimestamp, increment, update } from 'firebase/database';
import { database } from './app';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'admin';
  text: string;
  timestamp: number;
}

/**
 * Push a new message to the chat thread of a specific booking in Realtime Database.
 * Also increments the unread count of the other role.
 */
export async function sendMessage(
  bookingId: string,
  senderId: string,
  senderName: string,
  senderRole: 'patient' | 'admin',
  text: string,
): Promise<void> {
  const messagesRef = ref(database, `messages/${bookingId}`);
  const newMessageRef = push(messagesRef);

  await set(newMessageRef, {
    senderId,
    senderName,
    senderRole,
    text: text.trim(),
    timestamp: serverTimestamp(),
  });

  // Increment the unread count for the other role
  const otherRole = senderRole === 'patient' ? 'admin' : 'patient';
  const unreadRef = ref(database, `unread/${bookingId}`);
  await update(unreadRef, {
    [otherRole]: increment(1),
  });
}

/**
 * Subscribe to real-time message updates in the chat thread of a specific booking.
 * Returns the unsubscribe function.
 */
export function subscribeToMessages(
  bookingId: string,
  onData: (messages: ChatMessage[]) => void,
  onError?: (error: Error) => void,
) {
  const messagesRef = ref(database, `messages/${bookingId}`);

  return onValue(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        onData([]);
        return;
      }

      const list: ChatMessage[] = Object.keys(data).map((key) => {
        const msg = data[key];
        return {
          id: key,
          senderId: msg.senderId ?? '',
          senderName: msg.senderName ?? '',
          senderRole: msg.senderRole ?? 'patient',
          text: msg.text ?? '',
          timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : Date.now(),
        };
      });

      // Sort chronologically by timestamp
      list.sort((a, b) => a.timestamp - b.timestamp);
      onData(list);
    },
    (err) => {
      onError?.(err);
    },
  );
}

/**
 * Mark all messages in a booking's chat thread as read for a specific role.
 */
export async function markChatAsRead(bookingId: string, role: 'patient' | 'admin'): Promise<void> {
  const unreadUserRef = ref(database, `unread/${bookingId}/${role}`);
  await set(unreadUserRef, 0);
}

/**
 * Subscribe to a specific booking's unread message count for a role.
 */
export function subscribeToUnreadCount(
  bookingId: string,
  role: 'patient' | 'admin',
  onData: (count: number) => void,
) {
  const unreadUserRef = ref(database, `unread/${bookingId}/${role}`);
  return onValue(unreadUserRef, (snapshot) => {
    onData(snapshot.val() ?? 0);
  });
}

/**
 * Subscribe to all unread message count records across all bookings.
 */
export function subscribeToAllUnread(
  onData: (unreadMap: Record<string, { patient: number; admin: number }>) => void,
) {
  const unreadRef = ref(database, 'unread');
  return onValue(unreadRef, (snapshot) => {
    onData(snapshot.val() ?? {});
  });
}
