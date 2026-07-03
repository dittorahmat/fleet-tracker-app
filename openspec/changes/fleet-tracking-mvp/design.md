## Context

Aplikasi fleet tracking ini dirancang untuk diuji coba menggunakan simulator (Fase 1), dikembangkan ke aplikasi seluler (Fase 2), dan akhirnya menggunakan perangkat keras GPS tracker fisik (Fase 3). 
Dokumen ini mendefinisikan arsitektur backend, database, dan frontend untuk Fase 1 (MVP) dengan memastikan batasan-batasan sistem terisolasi agar siap dikembangkan di masa mendatang.

## Goals / Non-Goals

**Goals:**
- Membuat REST API menggunakan Node.js (Express) untuk menerima data telemetri lokasi dari klien.
- Membuat penyimpanan database lokal menggunakan SQLite untuk mencatat data perjalan kendaraan secara persisten.
- Membuat dashboard web satu halaman (SPA) berbasis HTML/CSS/JS menggunakan Leaflet.js untuk merender koordinat kendaraan secara interaktif di atas peta.
- Membuat script simulator (Node.js) untuk mereproduksi pergerakan kendaraan berdasarkan data koordinat simulasi (file JSON/CSV).

**Non-Goals:**
- Implementasi TCP/UDP gateway parser untuk IoT tracker fisik (ditunda ke Fase 3).
- Implementasi modul mobile app native/cross-platform (ditunda ke Fase 2).
- Sistem manajemen pengguna/autentikasi (auth) yang kompleks.

## Decisions

### 1. Backend Framework: Node.js & Express
- **Pilihan:** Node.js (Express) dengan ES Modules.
- **Rasional:** Cepat dideploy, performa I/O non-blocking yang sangat baik untuk menangani streaming data koordinat, dan memudahkan integrasi backend dengan dashboard frontend karena menggunakan bahasa pemrograman yang sama (JavaScript).

### 2. Database: SQLite dengan Drizzle ORM
- **Pilihan:** SQLite (menggunakan driver `better-sqlite3`) dikelola menggunakan **Drizzle ORM** (TypeScript/JavaScript).
- **Rasional:** 
  - **SQLite** sangat ringan, berbasis file tunggal, dan tidak memerlukan server database tambahan untuk tahap MVP.
  - **Drizzle ORM** memisahkan definisi skema dari mesin database. Kita mendefinisikan skema tabel sekali di kode JS/TS. Drizzle mempermudah migrasi ke PostgreSQL nantinya karena sintaksis query-nya sama; kita hanya perlu mengganti inisialisasi driver dari `drizzle-orm/better-sqlite3` ke `drizzle-orm/node-postgres` dan mengubah connection string di berkas konfigurasi.
- **Skema Database (Drizzle Schema):**
  - `vehicles`: `id` (text, primary key), `name` (text), `status` (text), `updatedAt` (integer/timestamp)
  - `location_logs`: `id` (integer, primary key autoincrement), `vehicleId` (text, foreign key references `vehicles.id`), `latitude` (real), `longitude` (real), `speed` (real), `heading` (real), `timestamp` (integer/timestamp)

### 3. Frontend Map: Leaflet.js dengan OpenStreetMap
- **Pilihan:** Leaflet.js via CDN.
- **Rasional:** Pustaka peta open-source yang sangat ringan, gratis, tidak memerlukan API key seperti Google Maps, dan sangat mudah digunakan untuk memetakan koordinat dan menggambar garis rute (polylines).

## Risks / Trade-offs

- **[Risk] SQLite Write Lock** ➔ SQLite mengunci seluruh database saat menulis data. Jika di masa depan ada ribuan kendaraan mengirim data secara bersamaan, ini akan menjadi bottleneck.
  - *Mitigasi:* Untuk MVP/Simulator saat ini, volume data masih rendah. Saat naik ke Fase 3 (IoT skala besar), database dapat dengan mudah dimigrasi ke PostgreSQL (dengan ekstensi TimescaleDB atau PostGIS).
- **[Risk] Kehilangan Sinyal Perangkat** ➔ Di dunia nyata, kendaraan bisa masuk ke area tanpa sinyal seluler sehingga data lokasi terlambat atau hilang.
  - *Mitigasi:* Format database mendukung `timestamp` (waktu perekaman lokasi di perangkat) yang terpisah dari `created_at` (waktu data masuk ke server). Hal ini mengizinkan perangkat mengirim data secara rapel (bulk upload) ketika koneksi internet kembali pulih.
