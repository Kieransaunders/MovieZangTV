/**
 * ParticipantsList Component
 * Modal displaying all room participants with voting status using Convex
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

interface ParticipantsListProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  participants: string[];
}

interface ParticipantWithStatus {
  participantId: string;
  votingCompleted: boolean;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  roomId,
  isOpen,
  onClose,
  participants: participantNames,
}) => {
  // Query participants with voting status from Convex (auto-reactive!)
  const participants = useQuery(
    api.rooms.getParticipants,
    { roomId: roomId as Id<'rooms'> }
  );

  // Transform participants for display
  const participantDetails = useMemo((): ParticipantWithStatus[] => {
    if (!participants) return [];

    return participants.map(p => ({
      participantId: p.participantId,
      votingCompleted: p.votingCompletedAt !== null,
    }));
  }, [participants]);

  const isLoading = participants === undefined;

  const renderParticipant = ({ item, index }: { item: ParticipantWithStatus; index: number }) => {
    const isHost = index === 0;
    const isCompleted = item.votingCompleted;

    return (
      <View style={styles.participantItem}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{item.participantId}</Text>
          {isHost && (
            <View style={styles.hostBadge}>
              <Text style={styles.hostBadgeText}>Host</Text>
            </View>
          )}
        </View>
        <View
          testID={`status-icon-${isCompleted ? 'completed' : 'pending'}-${item.participantId}`}
          style={[
            styles.statusIcon,
            isCompleted ? styles.statusIconCompleted : styles.statusIconPending,
          ]}
        >
          {isCompleted ? (
            <Text style={styles.statusIconText}>✓</Text>
          ) : (
            <ActivityIndicator size="small" color="#FF9500" />
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      testID="participants-modal"
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        testID="modal-backdrop"
        style={styles.backdrop}
        onPress={onClose}
        focusable={false}
      >
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()} focusable={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {participantDetails.length} Participant{participantDetails.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              testID="close-button"
              onPress={onClose}
              style={styles.closeButton}
              focusable={true}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator testID="loading-indicator" size="large" color="#ef4444" />
              <Text style={styles.loadingText}>Loading participants...</Text>
            </View>
          ) : participantDetails.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No participants yet</Text>
            </View>
          ) : (
            <FlatList
              data={participantDetails}
              keyExtractor={(item, index) => `${item.participantId}-${index}`}
              renderItem={renderParticipant}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* Legend */}
          {!isLoading && participantDetails.length > 0 && (
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.statusIconCompleted]}>
                  <Text style={styles.statusIconText}>✓</Text>
                </View>
                <Text style={styles.legendText}>Completed voting</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendIcon, styles.statusIconPending]}>
                  <ActivityIndicator size="small" color="#FF9500" />
                </View>
                <Text style={styles.legendText}>Voting in progress</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  hostBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  hostBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconCompleted: {
    backgroundColor: '#34C759',
  },
  statusIconPending: {
    backgroundColor: '#2C2C2E',
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  statusIconText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});

export default ParticipantsList;
