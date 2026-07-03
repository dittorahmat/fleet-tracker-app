## Why

Aplikasi pelacakan armada (fleet tracking) sangat penting bagi bisnis untuk memantau pergerakan kendaraan operasional, meningkatkan efisiensi rute, dan memastikan keamanan aset secara real-time. Dengan merancang arsitektur sistem yang bersifat *device-agnostic* (tidak bergantung pada tipe perangkat pelacak tertentu), aplikasi ini dapat dikembangkan secara bertahap mulai dari input web seluler sederhana, aplikasi ponsel (Android/iOS), hingga perangkat keras IoT GPS Tracker fisik tanpa merombak sistem inti (database & dashboard map).

## What Changes

Membangun fondasi sistem pelacakan armada (Fase 1 - MVP) dengan kapabilitas sebagai berikut:
- Pembuatan API ingestion yang menerima data koordinat dan telemetri dari perangkat pelacak.
- Pembuatan dashboard peta interaktif untuk memantau posisi terkini armada dan melihat sejarah pergerakan rute.
- Pembuatan alat simulasi rute kendaraan (simulator) untuk mempermudah pengujian alur data tanpa perangkat fisik.
- Rancangan database dan arsitektur backend yang modular dan siap untuk diintegrasikan dengan aplikasi mobile (Fase 2) dan GPS Tracker fisik berbasis TCP/UDP (Fase 3).

## Capabilities

### New Capabilities

- `device-ingestion`: Menyediakan API endpoint untuk menerima koordinat lokasi (latitude, longitude), kecepatan (speed), arah (heading), identitas perangkat (device ID/IMEI), dan timestamp dari perangkat pelacak.
- `dashboard-map`: Menyediakan antarmuka peta interaktif (menggunakan Leaflet.js) untuk menampilkan lokasi real-time dari semua armada terdaftar serta memutar ulang sejarah perjalanan rute (historical route playback).
- `device-simulator`: Script utilitas simulasi kendaraan yang secara otomatis mengirimkan koordinat secara periodik di rute jalan nyata untuk tujuan pengujian sistem secara lokal.

### Modified Capabilities

*(Tidak ada)*

## Impact

- **Backend APIs**: Menambahkan endpoint baru untuk penerimaan data koordinat (`POST /api/locations`) dan query data lokasi (`GET /api/vehicles` & `GET /api/vehicles/:id/history`).
- **Database**: Skema database baru untuk menyimpan informasi kendaraan (`vehicles`) dan riwayat koordinat lokasinya (`location_logs`).
- **Frontend Dashboard**: Aplikasi web front-end baru yang menampilkan visualisasi peta interaktif.
- **Testing Tools**: Menambahkan script simulator mandiri di sisi lokal.
