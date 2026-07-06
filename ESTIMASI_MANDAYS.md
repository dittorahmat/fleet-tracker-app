# Estimasi Man-Days Pengembangan Aplikasi & Setup Hardware

Dokumen ini memberikan perkiraan kebutuhan waktu kerja (*Man-Days*) yang mendetail untuk mengembangkan MVP Fleet Tracking saat ini menjadi sistem pelacakan GPS fisik siap pakai untuk rental kendaraan.

---

## Ringkasan Proyeksi Man-Days

*   **Total Waktu Kerja (Estimasi):** **22 Hari Kerja (Man-Days)** (Setara ~1 Bulan Kalender dengan 1 Developer Utama & 1 Teknisi Hardware/Part-Time).
*   **Peran yang Terlibat:**
    1.  **Full-stack Developer (Dev):** Bertanggung jawab atas backend TCP listener, API, database, integrasi server, dan dashboard frontend.
    2.  **Teknisi Elektrikal/GPS (Teknisi):** Bertanggung jawab atas instalasi kabel relay mobil dan konfigurasi awal modem GPS Tracker.

---

## Rincian Distribusi Fase Pengerjaan

```
LINIMASA PENGERJAAN (TOTAL: 22 MAN-DAYS)
════════════════════════════════════════════════════════════════════

Fase 1: Analisis & Desain (2 MD)
██

Fase 2: Backend & TCP Parser (6 MD)
██████

Fase 3: UI Dashboard & Kontrol (6 MD)
██████

Fase 4: Setup VPS & Uji Hardware (4 MD)
████

Fase 5: Instalasi & Uji Lapangan (4 MD)
████
```

---

## Detail Tugas & Estimasi Per Fase

### Fase 1: Analisis & Desain Arsitektur (Estimasi: 2 Man-Days)
Fase ini berfokus pada pemetaan protokol perangkat GPS yang dibeli dan perancangan skema data tambahan.
*   **Tugas 1.1:** Analisis dokumentasi protokol GPS tracker (misal protokol GT06 atau JT808 biner). (*Dev - 1 MD*)
*   **Tugas 1.2:** Perancangan skema database baru (tabel penyewa, tabel log status mesin, skema log relay/perintah). (*Dev - 1 MD*)

### Fase 2: Pengembangan Backend & Parser Protokol GPS (Estimasi: 6 Man-Days)
Memodifikasi backend agar bisa berkomunikasi langsung dengan GPS tracker komersial.
*   **Tugas 2.1:** Pembuatan *TCP Socket Server Listener* terpisah (menggunakan modul `net` Node.js) untuk menangani koneksi konstan dari GPS. (*Dev - 2 MD*)
*   **Tugas 2.2:** Pembuatan parser protokol biner (mengubah paket data GPS biner menjadi koordinat, status ACC, baterai, dan kecepatan). (*Dev - 2 MD*)
*   **Tugas 2.3:** Penambahan API untuk pengiriman perintah balik ke GPS (mengirim perintah mati mesin / *engine cut-off* via TCP Socket). (*Dev - 1 MD*)
*   **Tugas 2.4:** Unit Testing parser menggunakan data simulator ter-rekam. (*Dev - 1 MD*)

### Fase 3: Pengembangan UI Dashboard Frontend (Estimasi: 6 Man-Days)
Memperbarui dasbor React dengan peta Leaflet untuk menampilkan status operasional rental.
*   **Tugas 3.1:** Pembuatan fitur *Control Center* (Tombol Matikan/Hidupkan Mesin dengan proteksi PIN/Kata Sandi Admin). (*Dev - 1.5 MD*)
*   **Tugas 3.2:** Tampilan status indikator mesin (ACC ON/OFF) dan sisa baterai cadangan GPS pada peta dan panel detail kendaraan. (*Dev - 1.5 MD*)
*   **Tugas 3.3:** Fitur penggambaran wilayah Geofence dinamis langsung dari peta (menggunakan Leaflet Draw). (*Dev - 2 MD*)
*   **Tugas 3.4:** Pembuatan filter pencarian berdasarkan status rental (Sewa Aktif, Tersedia, Perbaikan). (*Dev - 1 MD*)

### Fase 4: Cloud Setup & Integrasi Hardware Awal (Estimasi: 4 Man-Days)
Melakukan deployment backend ke server VPS cloud publik dan menguji respons GPS di atas meja (*bench test*).
*   **Tugas 4.1:** Setup VPS Linux (Ubuntu), instalasi database PostgreSQL, konfigurasi firewall untuk port TCP GPS. (*Dev - 1.5 MD*)
*   **Tugas 4.2:** Konfigurasi kartu SIM M2M ke unit GPS via SMS (mengatur APN, IP server VPS, port, dan interval kirim). (*Dev & Teknisi - 1 MD*)
*   **Tugas 4.3:** Uji coba koneksi pertama perangkat GPS fisik ke server (memastikan data GPS masuk di VPS dan tampil di peta dashboard). (*Dev - 1.5 MD*)

### Fase 5: Instalasi Fisik & Uji Coba Lapangan (Estimasi: 4 Man-Days)
Melakukan pemasangan pada armada contoh dan melakukan uji jalan (*UAT*).
*   **Tugas 5.1:** Pemasangan unit GPS fisik + Relay pemutus pompa bensin di kendaraan uji coba (mobil rental contoh). (*Teknisi - 1.5 MD*)
*   **Tugas 5.2:** Pengujian fitur *Immobilizer* (mematikan mesin kendaraan dari dashboard saat mobil berhenti). (*Dev & Teknisi - 1 MD*)
*   **Tugas 5.3:** Uji jalan (*driving test*) untuk verifikasi akurasi data rute perjalanan dan sensitivitas notifikasi Geofence. (*Dev & Teknisi - 1.5 MD*)

---

## Rekomendasi Langkah Selanjutnya

1.  **Finalisasi Hardware:** Tentukan jenis GPS Tracker yang akan dibeli agar Developer dapat langsung mempelajari protokol komunikasinya (sangat direkomendasikan membeli minimal 1 unit untuk *bench test* di awal pengerjaan).
2.  **Pembuatan Proposal Kerja:** Jika Anda siap untuk mulai mengembangkan salah satu modul di atas (misal membuat purwarupa *TCP Server Listener*), kita dapat menyusun rancangan tugasnya.
