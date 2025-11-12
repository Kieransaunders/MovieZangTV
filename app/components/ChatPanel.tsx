/**
 * ChatPanel Component
 * Slide-out chat panel for room communication
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';
import { MessageItem, MessageReaction } from 'app/components/MessageItem';
import { TypingIndicator } from 'app/components/TypingIndicator';
import { spacing } from 'app/theme';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: Id<'rooms'>;
  currentParticipant: string;
  typingUsers: string[];
  onTyping: (isTyping: boolean) => void;
  onMessagesRead: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  onClose,
  roomId,
  currentParticipant,
  typingUsers,
  onTyping,
  onMessagesRead,
}) => {
  const insets = useSafeAreaInsets();
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(500)).current; // Start off-screen

  // Get chat messages
  const messages = useQuery(
    api.messages.getRecentMessages,
    roomId ? { roomId } : 'skip'
  );

  // Get message reactions
  const messageReactions = useQuery(
    api.messages.getMessageReactions,
    messages && messages.length > 0
      ? { messageIds: messages.map((m) => m._id) }
      : 'skip'
  );

  // Send message mutation
  const sendMessageMutation = useMutation(api.messages.sendMessage);

  // Add reaction mutation
  const addReactionMutation = useMutation(api.messages.addReaction);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Slide animation when opening/closing
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 0 : 500,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();

    // Mark messages as read when panel opens
    if (isOpen) {
      onMessagesRead();
    }
  }, [isOpen, slideAnim, onMessagesRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;

    try {
      await sendMessageMutation({
        roomId,
        participantId: currentParticipant,
        message: newMessage,
      });
      setNewMessage('');
      onTyping(false); // Clear typing status after sending
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (text: string) => {
    setNewMessage(text);
    onTyping(text.length > 0); // Set typing status when user types
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReactionMutation({
        messageId: messageId as Id<'messages'>,
        participantId: currentParticipant,
        emoji,
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          focusable={false}
        />

        {/* Chat Panel */}
        <Animated.View
          style={[
            styles.panel,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubble" size={20} color="#f97316" />
              <Text style={styles.headerTitle}>Chat</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} focusable={true}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.chatContainer}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
            >
              {messages && messages.length > 0 ? (
                messages.map((msg) => {
                  const msgReactions = (messageReactions?.[msg._id] || []) as MessageReaction[];
                  return (
                    <MessageItem
                      key={msg._id}
                      message={msg.message}
                      participantId={msg.participantId}
                      timestamp={msg.createdAt}
                      isCurrentUser={msg.participantId === currentParticipant}
                      reactions={msgReactions}
                      onReaction={(emoji) => handleReaction(msg._id, emoji)}
                      currentParticipant={currentParticipant}
                    />
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No messages yet.</Text>
                  <Text style={styles.emptySubtext}>Start the conversation!</Text>
                </View>
              )}

              {/* Typing Indicator */}
              <TypingIndicator typingUsers={typingUsers} />
            </ScrollView>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#8E8E93"
                value={newMessage}
                onChangeText={handleInputChange}
                maxLength={500}
                multiline={Platform.isTV && Platform.OS === 'ios' ? false : true}
                returnKeyType="send"
                editable={true}
                autoFocus={false}
                focusable={Platform.isTV ? true : undefined}
                blurOnSubmit={Platform.isTV ? false : undefined}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
                style={[
                  styles.sendButton,
                  !newMessage.trim() && styles.sendButtonDisabled,
                ]}
                focusable={true}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={newMessage.trim() ? '#fff' : '#8E8E93'}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: '85%',
    backgroundColor: '#1C1C1E',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(239, 68, 68, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#636366',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2C2C2E',
  },
});
