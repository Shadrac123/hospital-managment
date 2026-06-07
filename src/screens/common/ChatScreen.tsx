import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, IconButton } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { sendMessage, subscribeToMessages, ChatMessage, markChatAsRead } from '@/services/firebase';

export function ChatScreen({ route, navigation }: any) {
  const { bookingId, recipientName } = route.params;
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Subscribe to real-time chat messages
    const unsubscribe = subscribeToMessages(
      bookingId,
      (list) => {
        setMessages(list);
        setLoading(false);
        // Scroll to end shortly after messages load
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookingId]);

  useEffect(() => {
    if (!profile?.role || messages.length === 0) return;
    // Mark as read whenever the messages array updates
    markChatAsRead(bookingId, profile.role);
  }, [bookingId, messages.length, profile?.role]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !profile || sending) return;
    const textToSend = inputText;
    setInputText('');
    setSending(true);

    try {
      const senderRole = profile.role;
      const senderName = profile.displayName || 'Anonymous';
      await sendMessage(bookingId, user.uid, senderName, senderRole, textToSend);
      // Auto scroll to end on send
      flatListRef.current?.scrollToEnd({ animated: true });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.uid;
    return (
      <View style={[styles.messageRow, isMe ? styles.rowMe : styles.rowOther]}>
        {!isMe && (
          <View style={styles.senderAvatar}>
            <Text variant="caption" style={styles.avatarText}>
              {item.senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.bubbleContainer}>
          <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
            <Text
              variant="body"
              style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}
            >
              {item.text}
            </Text>
          </View>
          <Text variant="caption" color={colors.textTertiary} style={styles.timestamp}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Screen padded={false}>
      {/* Custom Chat Header */}
      <View style={styles.header}>
        <IconButton
          name="chevron-back"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        />
        <View style={styles.headerTitleContainer}>
          <Text variant="h3" style={styles.headerName}>
            {recipientName}
          </Text>
          <Text variant="caption" color={colors.success}>
            Online Support
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="bodyMuted" style={{ marginTop: spacing.md }}>
              Connecting to secure chat...
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
                <Text variant="h3" style={styles.emptyTitle}>
                  Secure Chat Initialized
                </Text>
                <Text variant="bodyMuted" style={styles.emptySubtitle}>
                  This chat is encrypted and monitored by the clinic care desk. Ask any questions about your booking.
                </Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons name="send" size={18} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitleContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  rowMe: {
    alignSelf: 'flex-end',
  },
  rowOther: {
    alignSelf: 'flex-start',
  },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    alignSelf: 'flex-end',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  bubbleContainer: {
    flexDirection: 'column',
  },
  bubble: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textMe: {
    color: colors.textInverse,
  },
  textOther: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    opacity: 0.8,
  },
  emptyTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
    fontSize: 12,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },
});
