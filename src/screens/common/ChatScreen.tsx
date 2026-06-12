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
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Text, IconButton } from '@/components/ui';
import { colors, radius, spacing, shadows } from '@/theme';
import { useAuth } from '@/context/AuthContext';
import { sendMessage, sendImageMessage, subscribeToMessages, ChatMessage, markChatAsRead } from '@/services/firebase';

export function ChatScreen({ route, navigation }: any) {
  const { bookingId, recipientName } = route.params;
  const { user, profile, role } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
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
    const activeRole = role || profile?.role;
    if (!activeRole || messages.length === 0) return;
    // Mark as read whenever the messages array updates
    markChatAsRead(bookingId, activeRole);
  }, [bookingId, messages.length, role, profile?.role]);

  const handleSend = async () => {
    if ((!inputText.trim() && !selectedImageUri) || !user || !profile || sending) return;
    const textToSend = inputText.trim();
    const imageToSend = selectedImageUri;

    setInputText('');
    setSelectedImageUri(null);
    setSending(true);

    try {
      const senderRole = role || profile.role || 'patient';
      const senderName = profile.displayName || 'Anonymous';

      if (imageToSend) {
        await sendImageMessage(bookingId, user.uid, senderName, senderRole, imageToSend, textToSend);
      } else {
        await sendMessage(bookingId, user.uid, senderName, senderRole, textToSend);
      }
      
      // Auto scroll to end on send
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setInputText(textToSend);
      setSelectedImageUri(imageToSend);
      Alert.alert('Send failed', err.message || 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachImage = () => {
    if (sending) return;

    Alert.alert(
      'Share Image',
      'Select a source for your photo:',
      [
        { text: 'Take Photo', onPress: handleCaptureCamera },
        { text: 'Choose from Gallery', onPress: handlePickGallery },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCaptureCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const handlePickGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImageUri(result.assets[0].uri);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.uid;
    const isImage = item.type === 'image' && !!item.imageUrl;

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
          <View style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleOther,
            isImage && styles.imageBubble,
          ]}>
            {isImage ? (
              <View>
                <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
                {item.text ? (
                  <Text
                    variant="body"
                    style={[styles.messageCaptionText, isMe ? styles.textMe : styles.textOther]}
                  >
                    {item.text}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text
                variant="body"
                style={[styles.messageText, isMe ? styles.textMe : styles.textOther]}
              >
                {item.text}
              </Text>
            )}
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

        {/* Selected Image Preview Area */}
        {selectedImageUri && (
          <View style={styles.previewContainer}>
            <View style={styles.previewWrapper}>
              <Image source={{ uri: selectedImageUri }} style={styles.previewThumbnail} />
              <Pressable
                style={styles.closePreviewBtn}
                onPress={() => setSelectedImageUri(null)}
                disabled={sending}
              >
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        )}

        {/* Input Bar */}
        <View style={[styles.inputBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
          <Pressable
            onPress={handleAttachImage}
            disabled={sending}
            style={styles.attachButton}
          >
            <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
          </Pressable>
          <TextInput
            style={styles.textInput}
            placeholder={selectedImageUri ? "Add a caption..." : "Type a message..."}
            placeholderTextColor={colors.textTertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <Pressable
            onPress={handleSend}
            disabled={(!inputText.trim() && !selectedImageUri) || sending}
            style={[
              styles.sendButton,
              ((!inputText.trim() && !selectedImageUri) || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Ionicons name="send" size={18} color={colors.textInverse} />
            )}
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
    paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.lg,
    paddingBottom: spacing.md,
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
  imageBubble: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: radius.lg,
    resizeMode: 'cover',
  },
  messageCaptionText: {
    fontSize: 14,
    lineHeight: 18,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  attachButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  previewContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  previewThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closePreviewBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    ...shadows.sm,
  },
});
