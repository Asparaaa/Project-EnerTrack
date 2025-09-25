// --- IMPORT BAGIAN-BAGIAN PENTING ---
import React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from "react-native";
// Menggunakan ikon dari Feather Icons
import { Feather } from '@expo/vector-icons';

// --- DEFINISI TIPE DATA (INTERFACE) ---
// Mendefinisikan properti (props) apa saja yang dibutuhkan oleh komponen ActionModal.
interface ActionModalProps {
  visible: boolean;       // Status untuk menampilkan atau menyembunyikan modal (true/false).
  onClose: () => void;      // Fungsi yang akan dipanggil saat modal ditutup.
  onDelete: () => void;     // Fungsi yang akan dipanggil saat tombol 'Delete' ditekan.
}


/**
 * ActionModal adalah komponen modal yang bisa dipakai ulang (reusable).
 * Modal ini akan muncul dari bawah layar dan menampilkan beberapa pilihan aksi,
 * seperti 'Delete'.
 */
const ActionModal: React.FC<ActionModalProps> = ({
  visible,
  onClose,
  onDelete,
}) => {
  return (
    // Komponen Modal bawaan dari React Native
    <Modal
      transparent // Membuat background modal transparan agar konten di belakangnya terlihat samar
      visible={visible} // Menampilkan/menyembunyikan modal berdasarkan prop 'visible'
      animationType="fade" // Animasi saat modal muncul dan hilang
      onRequestClose={onClose} // Menangani aksi tombol "back" di Android agar modal tertutup
    >
      {/* Pressable digunakan sebagai lapisan overlay di seluruh layar.
          Saat area gelap ini ditekan, modal akan tertutup. */}
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        {/* Ini adalah kontainer putih tempat konten modal (tombol aksi) berada */}
        <View style={styles.modalContent}>
          {/* Tombol untuk aksi 'Delete' */}
          <TouchableOpacity
            onPress={() => {
              // Jalankan fungsi delete, LALU tutup modalnya.
              onDelete();
              onClose();
            }}
            style={styles.actionButton}
          >
            <Feather name="trash-2" size={20} color="#DC2626" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
          {/* Kamu bisa menambahkan TouchableOpacity lain di sini untuk aksi lain, misalnya 'Edit' */}
        </View>
      </Pressable>
    </Modal>
  );
};

// --- STYLING KOMPONEN ---
const styles = StyleSheet.create({
  // Lapisan overlay gelap yang menutupi seluruh layar
  modalOverlay: {
    flex: 1, // Mengisi seluruh layar
    backgroundColor: 'rgba(0,0,0,0.4)', // Warna hitam transparan
    justifyContent: 'flex-end', // Mendorong konten modal ke bagian bawah layar
  },
  // Kontainer putih untuk konten modal
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    // Membuat sudut atas menjadi melengkung
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  // Styling untuk setiap tombol aksi di dalam modal
  actionButton: {
    flexDirection: 'row', // Membuat ikon dan teks sejajar secara horizontal
    alignItems: 'center', // Menyelaraskan ikon dan teks di tengah secara vertikal
    gap: 8, // Jarak antara ikon dan teks
    paddingVertical: 16,
  },
  // Styling khusus untuk teks 'Delete'
  deleteText: {
    fontSize: 16,
    color: '#DC2626', // Warna merah untuk aksi berbahaya
  },
});

export default ActionModal;
