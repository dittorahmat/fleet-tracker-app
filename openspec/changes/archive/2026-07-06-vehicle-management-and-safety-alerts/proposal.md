## Why

Admin membutuhkan kemampuan untuk mengganti nama kendaraan secara langsung dari dashboard, serta sistem deteksi dini peringatan bahaya sabotase pemutusan kabel listrik aki utama pada GPS tracker fisik.

## What Changes

- **Update Vehicle Name REST API**: Menambahkan rute `PUT /api/vehicles/:id` di backend Hono untuk memperbarui nama dan metadata kendaraan.
- **Frontend Edit UI**: Menambahkan tombol edit modal nama kendaraan pada sidebar kiri dashboard React.
- **Power Cut Alarm Detection**: Mengubah parser TCP socket dan parser GT06 untuk menangani status alarm `power_cut` (pemutusan kelistrikan aki utama).
- **Critical Sabotage Notification**: Memasukkan alert sabotase bertenaga aki terputus ke database alerts dan menyiarkannya via SSE dengan level bahaya tertinggi (*critical*).

## Capabilities

### New Capabilities
- `edit-vehicle-metadata`: Pengeditan nama kendaraan secara langsung dari antarmuka dasbor.
- `power-cut-detection`: Fitur pendeteksian sabotase pemutusan aki mobil dan pengiriman alert kritis.

### Modified Capabilities
<!-- Tidak ada perubahan kapabilitas lama, semua merupakan penambahan fitur -->

## Impact

- **Backend Route (`index.ts`)**: Penambahan endpoint baru `PUT /api/vehicles/:id`.
- **GT06 Parser (`db/gt06Parser.ts`)**: Penambahan pendeteksian alarm tipe `0x26` atau data teks alarm `power_cut`.
- **Frontend Dashboard (`App.tsx`)**: Penambahan UI modal dialog edit nama dan modifikasi tampilan notifikasi toast berwarna merah menyala untuk sabotase kelistrikan.
