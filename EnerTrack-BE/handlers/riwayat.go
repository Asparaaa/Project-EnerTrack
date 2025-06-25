package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"EnerTrack-BE/db"
)

// Struct untuk representasi item riwayat yang akan dikirim ke frontend
type HistoryResponseItem struct {
	ID            int     `json:"id"`
	Brand         string  `json:"brand"`
	NamaPerangkat string  `json:"nama_perangkat"`
	Daya          float64 `json:"daya"`
	Durasi        float64 `json:"durasi"`
	TanggalInput  string  `json:"tanggal_input"`
	CategoryID    int     `json:"category_id"`   // Ini adalah nama field JSON untuk frontend
	CategoryName  string  `json:"category_name"` // Ini adalah nama field JSON untuk frontend
}

func GetDeviceHistoryHandler(w http.ResponseWriter, r *http.Request) {
	session, err := Store.Get(r, "elektronik_rumah_session")
	if err != nil {
		log.Printf("❌ Error getting session in GetDeviceHistoryHandler: %v", err)
		http.Error(w, `{"error": "Gagal mendapatkan sesi"}`, http.StatusInternalServerError)
		return
	}

	username, ok := session.Values["username"].(string)
	if !ok {
		log.Println("❌ Unauthorized access to GetDeviceHistoryHandler: username not found in session")
		http.Error(w, `{"error": "Tidak terautentikasi"}`, http.StatusUnauthorized)
		return
	}

	var userID int
	err = db.DB.QueryRow("SELECT user_id FROM users WHERE username = ?", username).Scan(&userID)
	if err != nil {
		log.Printf("❌ Error getting user ID for username %s: %v", username, err)
		http.Error(w, `{"error": "Gagal mengambil user ID"}`, http.StatusInternalServerError)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Metode tidak diizinkan", http.StatusMethodNotAllowed)
		return
	}

	// ✅ KUNCI PERBAIKAN DI SINI:
	// Ubah `k.id` menjadi `k.kategori_id`
	// Pastikan `rp.kategori_id` (ini sudah benar dari sebelumnya)
	rows, err := db.DB.Query(`
		SELECT rp.id, rp.nama_perangkat, rp.merek, rp.daya, rp.durasi, rp.tanggal_input, k.kategori_id, k.nama_kategori
		FROM riwayat_perangkat rp
		JOIN kategori k ON rp.kategori_id = k.kategori_id
		WHERE rp.user_id = ?`, userID)

	if err != nil {
		log.Printf("❌ Error executing query: %v", err)
		http.Error(w, `{"error": "Gagal mengambil data riwayat"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var history []HistoryResponseItem
	for rows.Next() {
		var item HistoryResponseItem
		var categoryID int
		var categoryName string
		if err := rows.Scan(
			&item.ID,
			&item.NamaPerangkat,
			&item.Brand,
			&item.Daya,
			&item.Durasi,
			&item.TanggalInput,
			&categoryID,   // Mengambil k.kategori_id
			&categoryName, // Mengambil k.nama_kategori
		); err != nil {
			log.Printf("❌ Error scanning row: %v", err)
			http.Error(w, `{"error": "Gagal membaca data riwayat"}`, http.StatusInternalServerError)
			return
		}
		item.CategoryID = categoryID
		item.CategoryName = categoryName
		history = append(history, item)
	}

	if err := rows.Err(); err != nil {
		log.Printf("❌ Error iterating over rows: %v", err)
		http.Error(w, `{"error": "Gagal mengambil data riwayat"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(history)
}
