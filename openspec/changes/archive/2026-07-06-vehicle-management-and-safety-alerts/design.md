## Context

Pemberian nama kendaraan yang informatif mempermudah operasional rental mengidentifikasi armada. Deteksi pelepasan aki mobil (sabotase kelistrikan) diperlukan untuk mencegah bypass sistem GPS oleh pelaku pencurian.

## Goals / Non-Goals

**Goals:**
- Menyediakan endpoint REST `PUT /api/vehicles/:id` untuk mengubah informasi nama kendaraan.
- Menambahkan interaksi edit inline/modal nama kendaraan pada sidebar kiri dashboard.
- Mendeteksi alarm pemutusan daya aki utama (`power_cut`) pada server TCP biner/teks dan mengubahnya menjadi notifikasi kritis di dashboard.

**Non-Goals:**
- Pembuatan sistem pendaftaran akun pengemudi eksternal.
- Pelacakan tingkat kesehatan sel aki mobil (hanya mendeteksi kabel terhubung/putus).

## Decisions

### 1. REST API endpoint `PUT /api/vehicles/:id`
Kami menggunakan metode HTTP `PUT` di backend Hono untuk memfasilitasi pembaruan field `name` pada tabel `vehicles` di database PostgreSQL.

### 2. GT06 Parser Alarm Deteksi
Penyuntingan dilakukan di `gt06Parser.ts` untuk mendeteksi alarm biner GT06 (khususnya status alarm pelepasan daya eksternal / *Power Cut*) dan untuk text parser mendeteksi input `alarm:power_cut`.

### 3. Alarm Alerting Engine Integrasi
Ketika alert `power_cut` terdeteksi di server TCP, engine akan otomatis merekam alert dengan `type: "power_cut"`, keparahan `critical`, dan langsung menyiarkannya via SSE agar memunculkan notifikasi merah menyala (flashing) di dasbor UI.

## Risks / Trade-offs

- **[Risk]** Data GPS tumpukan (*buffered GPRS data*) memicu alarm `power_cut` berulang setelah sinyal kembali online.
  - *Mitigation:* Alerts engine akan mencocokkan jika alert `power_cut` yang sama (pada timestamp berdekatan) sudah pernah direkam, guna menghindari banjir notifikasi ganda.
