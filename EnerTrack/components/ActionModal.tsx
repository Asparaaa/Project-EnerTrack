import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from "react-native";
// Note: I've updated to use Feather icons since that's what the HistoryCard is using
import { Feather } from '@expo/vector-icons';

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  onDelete,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            onPress={() => {
              onDelete();
              onClose();
            }}
            style={styles.actionButton}
          >
            <Feather name="trash-2" size={20} color="#DC2626" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  deleteText: {
    fontSize: 16,
    color: '#DC2626',
  },
});

export default ActionModal;