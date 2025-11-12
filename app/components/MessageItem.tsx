/**
 * MessageItem Component
 * Individual chat message bubble with reactions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

interface MessageItemProps {
  message: string;
  participantId: string;
  timestamp: number;
  isCurrentUser: boolean;
  reactions?: MessageReaction[];
  onReaction: (emoji: string) => void;
  currentParticipant: string;
}

const quickReactions = ['👍', '❤️', '😂'];

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  participantId,
  timestamp,
  isCurrentUser,
  reactions = [],
  onReaction,
  currentParticipant,
}) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, isCurrentUser ? styles.rightAlign : styles.leftAlign]}>
      {/* Message bubble */}
      {isCurrentUser ? (
        <LinearGradient
          colors={['#f97316', '#ea580c']}
          style={[styles.bubble, styles.bubbleRight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.messageText, styles.messageTextRight]}>{message}</Text>
          <Text style={[styles.timestamp, styles.timestampRight]}>
            {formatTime(timestamp)}
          </Text>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.bubbleLeft]}>
          <Text style={styles.senderName}>{participantId}</Text>
          <Text style={[styles.messageText, styles.messageTextLeft]}>{message}</Text>
          <Text style={[styles.timestamp, styles.timestampLeft]}>
            {formatTime(timestamp)}
          </Text>
        </View>
      )}

      {/* Quick reactions */}
      <View style={styles.reactionsContainer}>
        {quickReactions.map((emoji) => {
          const reactionData = reactions.find((r) => r.emoji === emoji);
          const isReacted = reactionData?.users.includes(currentParticipant);

          return (
            <TouchableOpacity
              key={emoji}
              onPress={() => onReaction(emoji)}
              style={[
                styles.reactionButton,
                isReacted && styles.reactionButtonActive,
              ]}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              {reactionData && reactionData.count > 0 && (
                <Text style={styles.reactionCount}>{reactionData.count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  rightAlign: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  leftAlign: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    backgroundColor: '#2C2C2E',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextRight: {
    color: '#fff',
  },
  messageTextLeft: {
    color: '#E5E5EA',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  timestampRight: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampLeft: {
    color: '#8E8E93',
  },
  reactionsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 44, 46, 0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#f97316',
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: '#E5E5EA',
    marginLeft: 4,
  },
});
