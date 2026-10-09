# Kamus Variabel, Dasar Threshold, dan Pemicu

Dokumen acuan untuk tim backend. Berlaku untuk notebook, web simulator, dan spesifikasi.

## A. Kamus variabel keluaran insight (JSON)

Satu panggilan `generate_insight` mengembalikan satu objek. Setiap jenis insight memakai struktur field yang sama supaya backend dan UI cukup membuat satu parser.

### A.1 Level atas

| Field | Tipe | Contoh | Alasan ada |
|---|---|---|---|
| `device_id` | string | `"Kumbung 1"` | Menandai kumbung pemilik insight, dipakai untuk cache dan routing notifikasi |
| `generated_at` | string (waktu) | `"2026-08-31 09:35"` | Operator perlu tahu insight dibuat kapan, karena tenggat aksi dihitung dari waktu ini |
| `mode.automation_mode` | boolean | `true` | Sakelar tunggal: `true` memakai threshold mode Inkubasi, `false` memakai device Threshold manual |
| `mode.nama_mode` | string | `"Otomasi (profil Inkubasi)"` | Teks siap tampil di UI |
| `mode.tipe_threshold` | string | `"inkubasi"` atau `"threshold_manual"` | Nilai konstanta tipe, untuk audit sumber threshold |
| `jangka_pendek`, `jangka_menengah`, `jangka_panjang`, `rangkuman_periodik` | objek | lihat A.2 | Empat jenis insight menurut skala waktu |

### A.2 Isi tiap jenis insight

| Field | Tipe | Contoh | Alasan ada |
|---|---|---|---|
| `urgensi` | string | `"ok"`, `"near"`, `"warn"`, `"crit"` | Tingkat kegawatan untuk warna kartu, ikon, dan prioritas notifikasi tanpa harus mem-parsing kalimat |
| `judul` | string | `"Suhu mendekati batas dalam 15 menit"` | Satu kalimat yang bisa dibaca sekilas di daftar notifikasi |
| `ringkasan` | string | `"Suhu diperkirakan naik ke 27.7°C ..."` | Penjelasan angka: nilai prediksi, nilai saat ini, sisa jarak ke batas |
| `tindakan` | string | `"Sistem akan menyalakan exhaust fan ..."` | Apa yang dilakukan sistem (Otomasi) atau operator (Threshold manual) |
| `dampak` | string | `"Suhu terlalu tinggi dapat membuat miselium stres ..."` | Alasan tindakan perlu dilakukan. Kosong bila tidak ada risiko |
| `tambahan` | array string | `["Selain itu, kelembapan ..."]` | Parameter lain yang juga bermasalah, ditangani setelah parameter utama |
| `catatan` | string | `"Prediksi CO2 berada dalam margin ±15 ppm ..."` | Kualifikasi ketidakpastian, supaya insight tidak terlihat lebih pasti dari modelnya |
| `aksi_rekomendasi` | array objek | lihat A.3 | Versi terstruktur dari `tindakan`, untuk dikirim ke aktuator atau daftar tugas |
| `distribusi_status` | objek | `{normal_persen: 79, peringatan_persen: 21, kritis_persen: 0}` | Khusus `rangkuman_periodik`, untuk grafik batang |
| `stability_score`, `confidence`, `per_horizon` | angka, string, array | `84.2`, `"Sedang-Rendah"` | Khusus `jangka_panjang`: skor kondisi rata-rata, tingkat keyakinan, dan rincian per hari |
| `tren` | objek | `{temperature:{arah:"naik",...}}` | Khusus `jangka_menengah`: arah dan deret nilai per parameter, untuk grafik mini |
| `parameter_utama` | string | `"temperature"` | Khusus `jangka_pendek`: parameter yang menjadi pokok insight |

### A.3 Isi `aksi_rekomendasi`

| Field | Contoh | Alasan ada |
|---|---|---|
| `aktuator` | `"exhaust fan"` | Perangkat yang dituju. Pemetaan ke ID perangkat asli dilakukan backend |
| `tujuan` | `"ventilasi"` | Menjelaskan fungsi perangkat bagi operator |
| `dieksekusi_oleh` | `"sistem"` atau `"operator"` | Backend hanya mengirim perintah ke aktuator jika `"sistem"`. Jika `"operator"`, aksi hanya ditampilkan |
| `kapan` | `"sebelum pukul 09:50"` | Tenggat. Hindari kata "segera" tanpa patokan waktu |
| `prioritas` | `1` | Urutan penanganan bila lebih dari satu parameter bermasalah (1 = skor terendah, ditangani dulu) |

Catatan: nama field di versi web sebelumnya sempat disingkat (`ring`, `tind`, `damp`, `cat`, `acts`, `tone`). Mulai versi ini web memakai nama yang sama dengan spesifikasi dan notebook.

## B. Kamus konstanta dan variabel kode

| Variabel | Nilai | Alasan ada |
|---|---|---|
| `automation_mode` | `true` / `false` | Sakelar sumber threshold dan gaya kalimat tindakan |
| `TIPE_MODE_INKUBASI` | `"inkubasi"` | Konstanta tipe mode Inkubasi |
| `TIPE_DEVICE_THRESHOLD` | `"threshold_manual"` | Konstanta tipe device Threshold manual |
| `THRESHOLD_MODE_INKUBASI`, `THRESHOLD_DEVICE_MANUAL` | `min_kritis`, `min_peringatan`, `maks_peringatan`, `maks_kritis` per parameter | Batas yang menentukan status Normal, Peringatan, Kritis. Dipisah per sumber karena dapat berbeda |
| `titik_ideal` | `(min_peringatan + maks_peringatan) / 2` | Diturunkan, bukan ditulis tangan, agar ikut berubah saat threshold berubah |
| `FRAKSI_WASPADA` (`FW`) | `0.2` | Lebar zona peringatan dini (bagian B.1) |
| `MAPE_REF_15M` | suhu 0.28, kelembapan 0.61, CO2 1.46 (%) | Galat model dari Laporan Evaluasi Model. Dasar bobot skor |
| `MULT_MAPE` | pengali 0.6 sampai 6 menurut horizon | Meniru galat yang melebar pada horizon jauh. Hanya untuk simulasi dan bobot |
| `EPS_TREN` | suhu 0.5, kelembapan 1.5, CO2 40 | Selisih minimum agar dianggap naik atau turun, bukan sekadar noise |
| `MARGIN_CATATAN_CO2` | 15 ppm | Dari catatan reliabilitas: galat absolut CO2 sekitar 9 sampai 15 ppm di dekat batas |
| `AMBANG_DEGRADASI` | 70 | Skor gabungan di bawah ini dianggap menurun |
| `ATURAN_AKTUATOR` | (parameter, sisi) menjadi perangkat dan tujuan | Satu tempat untuk memetakan kondisi ke perangkat |
| `DAMPAK` | kalimat per (parameter, sisi) | Satu tempat untuk redaksi dampak, mudah diubah ahli budidaya |
| `ringkasan_cache` | hasil `ringkasan_periodik` | Rangkuman tidak dihitung tiap request |

### B.1 Batas peringatan dini (zona waspada)

Insight Jangka Pendek dan Menengah memberi peringatan dini saat nilai masih Normal tetapi sudah masuk **20% terluar dari rentang Normal** di sisi tersebut:

```
margin(param) = FRAKSI_WASPADA * (maks_peringatan - min_peringatan) / 2
waspada jika: nilai > maks_peringatan - margin   atau   nilai < min_peringatan + margin
(pembandingan strictly kurang dari, jarak dibulatkan 6 desimal agar tidak terpengaruh galat floating point)
```

| Parameter | Margin | Zona waspada bawah | Zona waspada atas |
|---|---|---|---|
| Suhu | 0.6°C | 22.0 sampai 22.6°C | 27.4 sampai 28.0°C |
| Kelembapan | 1.0% | 80 sampai 81% | 89 sampai 90% |
| CO2 | 50 ppm | 500 sampai 550 ppm | 950 sampai 1000 ppm |

Alasannya: tidak ada jurnal yang mendefinisikan margin peringatan dini untuk kumbung, jadi aturan ini adalah keputusan rekayasa, bukan kutipan literatur. Rumus proporsional dipilih agar margin otomatis menyesuaikan saat rentang threshold berubah atau berbeda per klien, dan lebar 20% cukup lebih besar dari galat model CO2 (9 sampai 15 ppm). Nilai 0.2 dapat disetel di satu variabel. Perlu disepakati dengan PIC.

## C. Dasar threshold dari literatur

Pencarian dilakukan pada sumber akses terbuka. Spesies utama adalah *Pleurotus ostreatus* (jamur tiram putih).

| Parameter | Nilai sistem | Temuan literatur | Penilaian |
|---|---|---|---|
| Suhu | Peringatan 22 sampai 28°C, ideal 25°C, Kritis 30°C | Pertumbuhan miselium optimal 25°C, rentang umum 20 sampai 28°C, pertumbuhan turun nyata pada 30°C (Asian Journal of Plant Pathology). Spawn run sekitar 24 sampai 25°C (UF/IFAS EDIS, Jurnal Ilmu Kehutanan UGM). Dua spesies jamur tiram tumbuh terbaik pada 28°C (Korea, Journal of Mushrooms). Inkubasi 22 sampai 28°C (Polinema) | **Didukung.** Ideal 25°C dan batas 28 sampai 30°C sejalan. Batas Kritis bawah 18°C belum punya acuan langsung |
| Kelembapan | Peringatan 80 sampai 90%, ideal 85%, Kritis 70 dan 98% | 80 sampai 90% untuk spawn run (UF/IFAS EDIS, UGM). Fase fruiting sekitar 85 sampai 92% (UC ANR). Sumber lokal bervariasi 60 sampai 80% dan 70 sampai 90% (Polinema, Polije, Univ. Negeri Makassar) | **Didukung** untuk 80 sampai 90%. Batas Kritis 70 dan 98% belum punya acuan langsung |
| CO2 | Peringatan 500 sampai 1000 ppm, ideal 750 ppm, Kritis 1500 ppm | Fase fruiting: di bawah sekitar 600 sampai 1000 ppm (UC ANR, makalah UCF). Fase spawn run/inkubasi: miselium toleran CO2 tinggi; pada budidaya botol, CO2 naik sampai sekitar 2.600 ppm lalu diturunkan ke 1.000 ppm saat panen (Korean Society of Mushroom Science); panduan penyuluh menyebut hingga 20.000 ppm | **Perlu keputusan.** Batas 500 sampai 1000 ppm cocok untuk fruiting, tetapi kemungkinan terlalu ketat untuk mode **Inkubasi** (peringatan CO2 palsu). Batas bawah 500 ppm juga tidak punya acuan (udara luar sekitar 420 ppm) |

Rekomendasi:
1. Pertahankan suhu dan kelembapan.
2. Pisahkan threshold CO2 per mode (`THRESHOLD_MODE_INKUBASI` dan profil Pembentukan Tubuh Buah), dan tanyakan ke ahli budidaya angka inkubasi yang dipakai di lapangan.
3. Validasi redaksi `DAMPAK` dengan ahli budidaya. Hanya dampak suhu tinggi yang punya dukungan langsung (pertumbuhan turun pada 30°C).

Sumber:
- [Effects of Temperature and H2O2 on Mycelial Growth and Yield of P. ostreatus (Asian Journal of Plant Pathology)](https://ajpp.scione.com/cms/abstract.php?id=36)
- [Oyster mushroom cultivation (UF/IFAS EDIS)](https://edis.ifas.ufl.edu/publication/SS662/pdf)
- [Cultivating Mushrooms on Small Farms (UC ANR)](https://ucanr.edu/sites/sfp/files/144812.pdf)
- [Growth environment analysis of oyster mushroom 'Suhan' (Korean Society of Mushroom Science)](https://www.earticle.net/Article/A342301)
- [Effects of Temperature and Nutrition on Growth of Oyster Mushrooms (Korea)](https://koreascience.or.kr/article/JAKO201510550514616.pdf)
- [Jurnal Ilmu Kehutanan UGM 13 (2019)](https://jurnal.ugm.ac.id/jikfkt/article/download/46209/24568)
- [Alat Kendali Kelembaban Budidaya Jamur Tiram (Polinema)](https://jpkm.polinema.ac.id/index.php/jpkm/article/download/147/113)

## D. Pemicu Rangkuman Periodik

Rangkuman Periodik tidak dipicu oleh kondisi kumbung, melainkan oleh jadwal, karena sumbernya data historis agregat 30 hari.

| Pemicu | Keterangan |
|---|---|
| Terjadwal mingguan (usulan: Senin 00:00) | Pemicu utama. Jendela 30 hari bergeser tiap minggu |
| Mode kumbung berganti | Threshold berganti sehingga persentase status berubah |
| Admin mengubah threshold | Alasannya sama |
| Tombol "Perbarui sekarang" (opsional) | Untuk laporan mendadak |

`generate_insight` hanya membaca hasilnya dari `ringkasan_cache`. Bila cache belum ada, `rangkuman_periodik` bernilai `null`. Frekuensi akhir (mingguan atau bulanan) perlu diputuskan dengan PIC.

## E. Insight saat kondisi normal

Kondisi normal tetap diberi penjelasan supaya operator tahu kenapa aman, bukan hanya "tidak ada masalah":

| Jenis | Isi saat normal |
|---|---|
| Jangka Pendek | Nilai tiap parameter, pernyataan bahwa prediksi 30 menit tidak mendekati batas, jarak terdekat ke batas (misalnya suhu 2.6°C, kelembapan 4.8%, CO2 240 ppm), tindakan, dan dampak ("tidak ada risiko") |
| Jangka Menengah | Tren stabil, jarak terdekat ke batas selama 6 jam, tindakan, dan dampak |
| Jangka Panjang | Kisaran skor kondisi, "tidak diperlukan tindakan khusus", dan dampak |

Kalimat tindakan mengikuti mode. Otomasi: "Sistem terus memantau dan akan menyalakan perangkat secara otomatis jika ada parameter mendekati batas." Threshold manual: "Lanjutkan pemantauan rutin, sistem akan memberi peringatan dini jika ada parameter mendekati batas."
