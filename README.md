# AIGRA Insight Simulator

Simulasi insight dan rekomendasi AI untuk kumbung jamur. Next.js 14 (App Router), TypeScript, Tailwind CSS.

## Fitur
- Mode Otomasi (profil Inkubasi) dan Threshold manual: kalimat tindakan berubah (sistem atau operator yang bertindak).
- Ringkasan status kumbung dengan indikator posisi nilai terhadap rentang Normal.
- Empat insight: Jangka Pendek, Jangka Menengah, Jangka Panjang, Rangkuman Periodik, lengkap dengan dampak dan perangkat yang terlibat.
- Tampilan perbandingan dua mode berdampingan.
- Grafik prediksi 6 jam, tabel skor kondisi dan keyakinan prediksi.
- Empat skenario, semua angka bisa diubah, insight dihitung ulang langsung.
- Unduh JSON dan salin teks insight.

## Menjalankan
```
npm install
npm run dev
```
Buka http://localhost:3000

## Deploy ke Vercel
1. `git init`, `git add .`, `git commit -m "AIGRA Insight Simulator"`.
2. Push ke GitHub.
3. Di vercel.com pilih Add New Project, import repository. Framework Next.js terdeteksi otomatis, klik Deploy.

## Menyesuaikan
- Threshold: `THR` di `lib/engine.js` (`inkubasi` dan `threshold_manual`). Nilai manual masih sama dengan Inkubasi.
- Keterangan dampak: `DMP` di `lib/engine.js` (perlu divalidasi ahli budidaya).
- Data Rangkuman Periodik: `R` di `lib/engine.js` (hasil notebook simulasi).
