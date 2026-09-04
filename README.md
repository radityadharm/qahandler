# Q&A Seminar

Aplikasi tanya jawab langsung ala Slido untuk acara seminar. Panitia membuat seminar,
membagikan satu link (atau kode QR) ke peserta, lalu memoderasi pertanyaan yang masuk
dari dashboard. Satu aplikasi bisa dipakai untuk banyak seminar sekaligus — tiap seminar
punya link sendiri.

Dibuat dengan Next.js (App Router) + Postgres, siap deploy ke Vercel.

## Fitur

**Untuk peserta** — buka link, isi nama (boleh dikosongkan kalau mau anonim), kirim
pertanyaan. Bisa melihat pertanyaan peserta lain dan mendukungnya lewat upvote, diurutkan
berdasarkan terpopuler atau terbaru. Pertanyaan sendiri ditandai supaya gampang dicari.

**Untuk panitia** — dashboard moderasi per seminar: tandai pertanyaan sudah dijawab,
tahan yang mau dibahas belakangan, sembunyikan yang tidak relevan, atau hapus. Ada
filter per status, unduh CSV untuk dokumentasi acara, serta empat sakelar pengaturan
yang bisa diubah kapan saja saat acara berjalan (buka/tutup sesi, tampilkan daftar ke
peserta, upvote, dan moderasi sebelum tampil).

**Layar presentasi** — halaman khusus untuk proyektor dengan latar gelap dan huruf besar.
Panitia menekan "Sorot di layar" pada satu pertanyaan, lalu pertanyaan itu tampil besar di
layar. Kalau tidak ada yang disorot, layar menampilkan antrean pertanyaan terpopuler.
Kode QR menuju halaman peserta selalu tampil di pojok, jadi penonton bisa langsung ikut.

**Link materi** — panitia menautkan materi (slide/Drive/PDF) ke seminar. Peserta membuka
link pendek dari app (`/m/<kode>`) yang otomatis diteruskan ke materi itu, jadi tautannya
bisa diganti kapan saja tanpa mengubah link atau QR yang sudah tersebar.

**Gambar QR siap-share** — link peserta maupun link materi bisa diunduh sebagai gambar
persegi 1080×1080 (berisi judul, QR, dan alamat) yang enak dibagikan ke grup WhatsApp.

## Cara deploy ke Vercel

### 1. Siapkan database

Di dashboard Vercel, buka proyekmu → tab **Storage** → **Create Database** → pilih
**Neon**. Vercel akan otomatis menambahkan `DATABASE_URL` ke environment variable proyek.

Selain Neon, koneksi Postgres mana pun juga jalan (Supabase, Railway, Postgres sendiri).
Isi saja `DATABASE_URL` dengan connection string-nya.

### 2. Buat tabelnya

Jalankan isi [`db/schema.sql`](db/schema.sql) satu kali di database tersebut — lewat SQL
editor Neon/Supabase, atau dari terminal:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

> Sudah pernah deploy versi lama? Jalankan `db/schema.sql` sekali lagi — skripnya idempoten
> dan otomatis menambahkan kolom baru (mis. `materials_url` untuk fitur link materi).

Skripnya aman dijalankan berulang kali.

### 3. Set environment variable

Di **Settings → Environment Variables**, tambahkan:

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | ya | Connection string Postgres. Terisi otomatis kalau pakai integrasi Neon. |
| `ADMIN_PASSWORD` | ya | Password untuk membuka `/admin`. |
| `AUTH_SECRET` | disarankan | String acak panjang untuk menandatangani cookie sesi admin. Buat dengan `openssl rand -base64 32`. Kalau dikosongkan, `ADMIN_PASSWORD` yang dipakai sebagai kunci tanda tangan — jalan, tapi berarti mengganti password ikut membatalkan semua sesi yang sedang aktif. |
| `NEXT_PUBLIC_APP_URL` | tidak | Isi kalau memakai domain kustom dan ingin link yang dibagikan selalu memakai domain itu. Kalau kosong, alamatnya diambil dari host permintaan. |

### 4. Deploy

Push ke GitHub lalu import reponya di Vercel, atau jalankan `vercel --prod`. Tidak ada
konfigurasi build khusus — Vercel mengenali Next.js secara otomatis.

## Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env.local     # lalu isi nilainya
psql "$DATABASE_URL" -f db/schema.sql
npm run dev
```

Buka http://localhost:3000.

## Alur pemakaian saat acara

1. Buka `/admin`, masukkan `ADMIN_PASSWORD`.
2. Buat seminar. Kode seminarnya otomatis dibuat dari judul, tapi boleh diisi sendiri
   (misalnya `seminar-ai-2026`) supaya linknya enak dibaca.
3. Dari kartu seminar, klik **Buka moderasi**. Di situ ada tombol salin link peserta,
   tampilkan kode QR, dan buka layar presentasi.
4. Bagikan link peserta, atau tampilkan layar presentasi di proyektor supaya penonton
   bisa scan QR-nya.
5. Selama sesi, moderasi pertanyaan yang masuk. Halaman peserta dan layar presentasi
   ikut berubah sendiri dalam beberapa detik tanpa perlu di-refresh.
6. Selesai acara, matikan sakelar **Terima pertanyaan baru** dan unduh CSV-nya.

Link moderasi memuat token rahasia, jadi bisa dibagikan ke moderator lain tanpa perlu
memberikan `ADMIN_PASSWORD`. Siapa pun yang punya link itu bisa memoderasi seminar
tersebut — dan hanya seminar itu.

## Struktur

```
db/schema.sql              skema database
src/app/                   halaman + route handler
  page.tsx                 halaman depan (masukkan kode seminar)
  s/[slug]/                halaman peserta
  s/[slug]/live/           layar presentasi
  admin/                   login + daftar seminar
  admin/s/[token]/         dashboard moderasi
  api/                     endpoint publik, admin, dan moderasi
src/lib/                   akses database, autentikasi, tipe bersama
src/lib/client/            helper sisi browser (polling, localStorage, format)
src/components/            komponen UI yang dipakai berulang
```

Halaman dirender di server lebih dulu supaya cepat tampil, lalu klien melakukan polling
tiap 4–5 detik untuk pembaruan. Polling berhenti sendiri saat tab tidak aktif.

## Catatan teknis

- Identitas peserta memakai ID acak yang disimpan di `localStorage` browser, tanpa login.
  Ini yang dipakai untuk mencegah upvote ganda dan membatasi pengiriman (maksimal 5
  pertanyaan per menit per orang). Peserta yang membersihkan data browser akan dianggap
  sebagai orang baru — wajar untuk acara satu kali seperti seminar.
- Jumlah upvote dihitung ulang dari tabel vote setiap kali ada perubahan, jadi angkanya
  tidak pernah melenceng meski ada permintaan yang bertabrakan.
- Menghapus seminar ikut menghapus semua pertanyaan dan vote-nya.

## Perintah

```bash
npm run dev      # server pengembangan
npm run build    # build produksi
npm start        # jalankan hasil build
npm run lint     # ESLint
npx tsc --noEmit # cek tipe
```
