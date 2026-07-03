## 1. Setup Project & Database

- [x] 1.1 Inisialisasi package.json dan instal dependensi backend (express, cors, drizzle-orm, better-sqlite3, dotenv) serta devDependencies (drizzle-kit)
- [x] 1.2 Konfigurasi `drizzle.config.js` dan buat definisi skema database Drizzle (`schema.js` untuk `vehicles` dan `location_logs`)
- [x] 1.3 Lakukan inisialisasi database dan jalankan migrasi Drizzle (`drizzle-kit push` atau `drizzle-kit generate`) untuk membuat berkas SQLite lokal dan tabelnya

## 2. Implementasi Ingestion & Retrieve API

- [x] 2.1 Buat endpoint `POST /api/locations` untuk menerima data koordinat lokasi perangkat
- [x] 2.2 Buat endpoint `GET /api/vehicles` untuk mengambil posisi terakhir semua armada
- [x] 2.3 Buat endpoint `GET /api/vehicles/:id/history` untuk mengambil riwayat koordinat berdasarkan filter waktu

## 3. Implementasi Frontend Dashboard Map

- [x] 3.1 Buat template HTML/CSS dashboard utama dengan layout sidebar dan area peta
- [x] 3.2 Integrasikan Leaflet.js ke dashboard untuk menampilkan peta OpenStreetMap
- [x] 3.3 Hubungkan dashboard ke API `GET /api/vehicles` untuk me-render posisi marker kendaraan secara real-time
- [x] 3.4 Buat panel riwayat untuk menggambar jalur polyline rute perjalanan menggunakan API `GET /api/vehicles/:id/history`

## 4. Implementasi Simulator & Verifikasi

- [x] 4.1 Buat data koordinat rute simulasi dalam format JSON/CSV
- [x] 4.2 Buat script simulator (`simulator.js`) yang membaca data koordinat dan mengirimkan POST HTTP request secara berkala
- [x] 4.3 Jalankan simulator dan verifikasi data masuk ke database serta ter-render dengan baik di map dashboard
