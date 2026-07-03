## 1. Setup Project & Database

- [ ] 1.1 Inisialisasi package.json dan instal dependensi backend (express, sqlite3/better-sqlite3, cors)
- [ ] 1.2 Setup skema database SQLite (`vehicles` dan `location_logs`) dan script migrasi/inisisalisasi DB
- [ ] 1.3 Implementasi utility helper koneksi database di backend

## 2. Implementasi Ingestion & Retrieve API

- [ ] 2.1 Buat endpoint `POST /api/locations` untuk menerima data koordinat lokasi perangkat
- [ ] 2.2 Buat endpoint `GET /api/vehicles` untuk mengambil posisi terakhir semua armada
- [ ] 2.3 Buat endpoint `GET /api/vehicles/:id/history` untuk mengambil riwayat koordinat berdasarkan filter waktu

## 3. Implementasi Frontend Dashboard Map

- [ ] 3.1 Buat template HTML/CSS dashboard utama dengan layout sidebar dan area peta
- [ ] 3.2 Integrasikan Leaflet.js ke dashboard untuk menampilkan peta OpenStreetMap
- [ ] 3.3 Hubungkan dashboard ke API `GET /api/vehicles` untuk me-render posisi marker kendaraan secara real-time
- [ ] 3.4 Buat panel riwayat untuk menggambar jalur polyline rute perjalanan menggunakan API `GET /api/vehicles/:id/history`

## 4. Implementasi Simulator & Verifikasi

- [ ] 4.1 Buat data koordinat rute simulasi dalam format JSON/CSV
- [ ] 4.2 Buat script simulator (`simulator.js`) yang membaca data koordinat dan mengirimkan POST HTTP request secara berkala
- [ ] 4.3 Jalankan simulator dan verifikasi data masuk ke database serta ter-render dengan baik di map dashboard
