## Why

Integrasi perangkat keras GPS Tracker komersial diperlukan untuk mendukung pelacakan armada rental kendaraan secara nyata (real-time) di lapangan serta fitur pengamanan kelistrikan kendaraan (engine cut-off / immobilizer) untuk mencegah pencurian kendaraan.

## What Changes

- **TCP Socket Server Listener**: Menambahkan modul TCP listener untuk menangani koneksi konstan dan data streaming dari GPS tracker.
- **Protokol Parser**: Menambahkan parser protokol data biner GPS (seperti protokol GT06) agar dapat menerjemahkan koordinat GPS, kecepatan, arah, status kontak mesin, dan voltase baterai.
- **Immobilizer Control (Engine Cut-off)**: Menambahkan API kontrol relay mesin dan antarmuka tombol di dashboard untuk memutus/menyambung kelistrikan kendaraan dari jauh.
- **Dynamic Geofence Drawing**: Mengintegrasikan fitur menggambar geofence melingkar langsung dari dasbor peta.
- **Status Dashboard**: Menampilkan status kontak mesin (ACC ON/OFF) dan level baterai cadangan GPS di UI.

## Capabilities

### New Capabilities
- `tcp-gps-listener`: Kemampuan menerima koneksi raw TCP dan melakukan parser data biner GPS dari perangkat fisik.
- `immobilizer-control`: Fitur kontrol relay pemutus mesin jarak jauh terintegrasi antara dashboard dan socket TCP perangkat.
- `dynamic-geofence-drawing`: Fitur interaktif untuk membuat, memperbarui, dan menghapus geofence secara visual langsung di peta dashboard.

### Modified Capabilities
<!-- Tidak ada spesifikasi fungsionalitas lama yang diubah perilakunya, hanya penambahan kapabilitas baru -->

## Impact

- **Backend API (`index.ts` & `db/`)**: Penambahan modul TCP listener baru (`tcpServer.ts`) berdaruh pada penataan *port binding* di server.
- **Database Schema (`db/schema.ts`)**: Penambahan field baru di database seperti status kelistrikan mesin (`acc_status`), status relay, dan level baterai pada tabel `location_logs`.
- **Frontend Dashboard (`App.tsx`)**: Integrasi pustaka *Leaflet Draw* untuk penggambaran wilayah di peta dan pembuatan komponen tombol aksi kontrol kelistrikan mesin.
