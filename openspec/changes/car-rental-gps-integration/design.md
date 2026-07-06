## Context

Aplikasi Fleet Tracking MVP saat ini berjalan di atas HTTP API menerima data JSON. Untuk mengintegrasikannya dengan perangkat keras GPS fisik komersial (seperti Concox GT06N), kita membutuhkan server TCP Socket yang terus mendengarkan koneksi data biner beraliran berkelanjutan (*streaming*), menerjemahkannya, dan mampu mengirim balik paket instruksi kontrol (pemutus arus relay mesin).

## Goals / Non-Goals

**Goals:**
- Membuat modul TCP socket server terpisah pada port 8000.
- Mengimplementasikan decoder biner untuk protokol populer Concox GT06.
- Membuka kontrol relay *immobilizer* melalui API REST HTTP.
- Memungkinkan pembuatan geofence secara interaktif di peta dashboard frontend.

**Non-Goals:**
- Mengembangkan SMS Gateway terintegrasi (perintah kirim balik murni lewat socket TCP GPRS).
- Mendukung protokol multi-vendor di luar keluarga GT06 (untuk lingkup MVP awal).

## Decisions

### 1. Penggunaan Modul Native Node.js `net` untuk Server TCP
Kami memilih menggunakan library bawaan `net` dari Node.js untuk mendengarkan koneksi TCP socket di backend Hono guna mengurangi ketergantungan library luar dan memudahkan pengelolaan siklus hidup koneksi socket.

### 2. Registry Socket dalam Memori (*In-Memory Connection Registry*)
Untuk mengirimkan perintah *immobilizer* ke GPS fisik, server harus tahu socket mana yang milik kendaraan mana.
- Kami akan menggunakan objek `Map<string, net.Socket>` dalam memori di backend.
- Kunci dari map adalah `device_id` yang didapatkan saat GPS melakukan jabat tangan (*handshake*) pertama kali di protokol TCP.

### 3. Leaflet Draw di Frontend
Integrasi alat gambar lingkar geofence di peta menggunakan library `@geoman-io/leaflet-geoman-free` atau `leaflet-draw` untuk antarmuka melingkar yang mudah disimpan ke database PostgreSQL.

## Risks / Trade-offs

- **[Risk]** Server restart menghapus seluruh daftar socket aktif di memori.
  - *Mitigation:* Alat GPS tracker fisik memiliki mekanisme bawaan untuk mendeteksi *heartbeat timeout* dan otomatis menyambung kembali (*auto-reconnect*) ketika server aktif kembali.
- **[Risk]** Pemutusan mesin secara sengaja saat mobil berkecepatan tinggi dapat membahayakan keselamatan pengemudi.
  - *Mitigation:* API backend wajib melakukan validasi kecepatan terakhir dari database. Jika kecepatan > 20 km/jam, perintah pemutusan mesin ditolak dengan kode respon HTTP 400.
