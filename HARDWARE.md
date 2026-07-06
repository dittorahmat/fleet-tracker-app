# Analisis Kebutuhan Perangkat Keras & Estimasi Biaya GPS Tracker

Dokumen ini memuat panduan lengkap mengenai kebutuhan perangkat keras (hardware) dan rincian estimasi biaya untuk mengimplementasikan sistem pelacakan GPS real-time pada rental kendaraan.

---

## 1. Pilihan Perangkat Keras (GPS Tracker)

Berikut adalah rekomendasi tipe perangkat keras yang populer dan teruji di pasar Indonesia:

| Spesifikasi | Concox GT06N (Pilihan Ekonomis) | Jimi IoT JM-VL03 (Rekomendasi 4G) | Teltonika FMC920 (Pilihan Premium) |
| :--- | :--- | :--- | :--- |
| **Pabrikan** | Concox / Jimi IoT | Jimi IoT | Teltonika (Eropa) |
| **Konektivitas Jaringan** | 2G | 4G LTE & 2G | 4G LTE (Cat 1) & 2G |
| **Fitur Utama** | Pelacakan real-time, Deteksi Kontak (ACC), Sadap Suara Kabin, Relay (Immobilizer), Tombol SOS. | Pelacakan real-time presisi tinggi, Relay (Immobilizer), Deteksi Voltase Aki, Desain kompak & tahan air. | Standar industri (sangat awet), Konfigurasi canggih, Pelacakan perilaku pengemudi, Relay (Immobilizer). |
| **Rekomendasi Penggunaan** | Rental mobil kecil, budget terbatas. | Rental mobil komersial, investasi jangka panjang (siap 4G). | Manajemen armada korporat, logistik, kebutuhan durabilitas tinggi. |
| **Estimasi Harga Perangkat** | **Rp350.000 - Rp450.000** | **Rp800.000 - Rp950.000** | **Rp1.100.000 - Rp1.400.000** |

---

## 2. Kebutuhan Kartu SIM & Paket Data (M2M / IoT)

GPS tracker membutuhkan kartu SIM khusus mesin (Machine-to-Machine) yang memiliki jalur koneksi dedicated APN agar pengiriman koordinat stabil dan aman dari blokir IMEI.

### Pilihan Provider Terpopuler:
1. **Telkomsel IoT (Sangat Direkomendasikan):** Memiliki jangkauan sinyal terluas di Indonesia, sangat cocok untuk armada yang sering keluar kota/daerah pelosok.
2. **XL Axiata IoT / Indosat Ooredoo Hutchison IoT:** Alternatif dengan tarif yang kompetitif untuk wilayah perkotaan.

### Rincian Biaya Paket Data M2M (Rata-rata Kuota 25MB - 50MB/bulan):
* **Paket Bulanan:** Rp30.000 - Rp45.000 per bulan.
* **Paket Tahunan (Rekomendasi):** Rp300.000 - Rp400.000 per tahun (Setara **Rp25.000 - Rp33.000/bulan**).

---

## 3. Estimasi Biaya Awal & Operasional Bulanan

Berikut proyeksi total pengeluaran untuk **1 Unit Kendaraan**:

### A. Pengeluaran Awal (Sekali Beli)
* **Perangkat GPS Tracker (JM-VL03 4G):** Rp850.000
* **Kartu SIM Perdana M2M + Paket 1 Tahun:** Rp350.000
* **Jasa Instalasi Teknisi (Pasang Relay & Kelistrikan):** Rp150.000
* **Total Biaya Awal per Kendaraan:** **Rp1.350.000**

### B. Biaya Operasional Rutin (Tahun Ke-2 dan Seterusnya)
* **Paket Data SIM M2M (Tahunan):** Rp350.000 / tahun (atau ~Rp29.000 / bulan)
* **Sewa Server VPS (Untuk host Backend & DB sendiri):** Rp100.000 / bulan (biaya ini dibagi rata ke seluruh jumlah armada Anda. Jika Anda memiliki 10 armada, maka biayanya hanya Rp10.000 / kendaraan / bulan).

---

## 4. Perbandingan Finansial (Sistem Sendiri vs Vendor Pihak Ketiga)

Apabila diasumsikan Anda mengelola **20 unit armada rental**:

```
PERBANDINGAN BIAYA OPERASIONAL BULANAN (20 KENDARAAN)
═════════════════════════════════════════════════════

Sewa Vendor Pihak Ketiga (Rata-rata Rp100.000/unit/bulan)
┌────────────────────────────────────────────────────────┐
│ Rp2.000.000 / bulan                                    │
└────────────────────────────────────────────────────────┘

Membangun Aplikasi Sendiri (SIM Card Rp30.000 + Server Rp100.000)
┌────────────────────────────────────┐
│ Rp700.000 / bulan                  │
└────────────────────────────────────┘
```

> [!TIP]
> Dengan menggunakan aplikasi kustom buatan sendiri berbasis MVP ini, Anda dapat memangkas biaya operasional bulanan hingga **~65%** dibandingkan menggunakan layanan vendor pelacakan GPS pihak ketiga.
