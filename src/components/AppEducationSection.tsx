import React from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Store, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Smartphone, 
  Layers, 
  Calculator, 
  DollarSign, 
  PackageX, 
  Cpu, 
  Zap,
  HelpCircle,
  Award
} from 'lucide-react';
import { SoundFx } from '../services/soundFx';

interface AppEducationSectionProps {
  onOpenLoginModal: () => void;
}

export const AppEducationSection: React.FC<AppEducationSectionProps> = ({ onOpenLoginModal }) => {
  const handleCtaClick = () => {
    SoundFx.unlockAudio();
    SoundFx.playRobotButtonClick();
    onOpenLoginModal();
  };

  return (
    <section 
      id="edukasi-seller-profit" 
      className="relative z-20 w-full max-w-6xl mx-auto px-4 py-12 sm:py-16 text-white space-y-12"
    >
      {/* Ambient Neon Glows - Zero-Blur Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[radial-gradient(circle,_rgba(37,244,238,0.14)_0%,_transparent_70%)] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[radial-gradient(circle,_rgba(254,44,85,0.14)_0%,_transparent_70%)] rounded-full pointer-events-none -z-10" />

      {/* =================================================================== */}
      {/* 1. HEADER SECTION                                                   */}
      {/* =================================================================== */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[#25F4EE] text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#25F4EE]" />
          <span>Edukasi &amp; Panduan Lengkap Seller Profit</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
          Kenapa Setiap Seller Marketplace <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#25F4EE] via-white to-[#FE2C55]">
            Wajib Menggunakan Seller Profit?
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal">
          Banyak seller mengira omzet besar berarti untung besar. Nyatanya, potongan biaya komisi marketplace, biaya gratis ongkir, retur barang, dan budget iklan seringkali menggerus laba tanpa disadari. Seller Profit hadir sebagai solusi akuntansi presisi anti-boncos.
        </p>
      </div>

      {/* =================================================================== */}
      {/* 2. EDUKASI TENTANG APLIKASI (APA ITU SELLER PROFIT)                 */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="spatial-card p-6 rounded-3xl border border-white/10 hover:border-[#25F4EE]/40 transition-all group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE] group-hover:scale-110 transition-transform">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white group-hover:text-[#25F4EE] transition-colors">
              Bukan Sekadar Catatan Kas
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bukan buku kas umum biasa. Seller Profit dirancang khusus dengan rumus perhitungan skema biaya admin marketplace Indonesia (Shopee, TikTok Shop, Tokopedia, Lazada) secara otomatis dan real-time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-[#25F4EE]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kalkulasi Otomatis Presisi</span>
          </div>
        </div>

        <div className="spatial-card p-6 rounded-3xl border border-white/10 hover:border-[#FE2C55]/40 transition-all group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FE2C55]/10 border border-[#FE2C55]/30 flex items-center justify-center text-[#FE2C55] group-hover:scale-110 transition-transform">
              <PackageX className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white group-hover:text-[#FE2C55] transition-colors">
              Pantau Retur &amp; Iklan Boncos
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Berapa banyak paket COD yang gagal terkirim dan barang hilang di ekspedisi? Seller Profit melacak setiap kerugian retur dan efisiensi ROAS iklan agar modalmu tidak bocor halus.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-[#FE2C55]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Deteksi Kebocoran Modal</span>
          </div>
        </div>

        <div className="spatial-card p-6 rounded-3xl border border-white/10 hover:border-[#25F4EE]/40 transition-all group flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#25F4EE]/10 border border-[#25F4EE]/30 flex items-center justify-center text-[#25F4EE] group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white group-hover:text-[#25F4EE] transition-colors">
              Hak Akses Owner vs Pegawai
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pegawai kasir atau admin packing dapat mencatat transaksi tanpa bisa melihat margin laba bersih toko, data modal HPP, atau saldo rekening pribadi pemilik toko.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[11px] font-mono text-[#25F4EE]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Role-Based Access Control</span>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. KEUNTUNGAN UTAMA (BENEFITS)                                       */}
      {/* =================================================================== */}
      <div className="spatial-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <span className="text-[11px] font-mono text-[#FE2C55] font-bold uppercase tracking-wider">
              KEUNTUNGAN NYATA
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
              5 Keuntungan Utama Bagi Bisnis Tokomu
            </h3>
          </div>
          <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
            Dipercaya Ratusan Toko Marketplace
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <div className="p-2.5 rounded-xl bg-[#25F4EE]/15 text-[#25F4EE] shrink-0 mt-0.5">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">1. Kepastian Laba Bersih Riil (Real Net Profit)</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Menghitung laba setelah dikurangi biaya admin layanan, gratis ongkir XTRA, cashback, biaya promo, biaya packaging, dan gaji karyawan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <div className="p-2.5 rounded-xl bg-[#FE2C55]/15 text-[#FE2C55] shrink-0 mt-0.5">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">2. Multi-Toko &amp; Multi-Platform Terpusat</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Punya 5 toko di Shopee dan 3 toko di TikTok? Semua dapat dikelola dalam satu aplikasi tanpa harus login bergantian di browser berbeda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <div className="p-2.5 rounded-xl bg-[#25F4EE]/15 text-[#25F4EE] shrink-0 mt-0.5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">3. Laporan Keuangan Standar Akuntansi Siap Pakai</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Laporan Laba Rugi (P&amp;L), Neraca, Arus Kas, dan Rekapitulasi Penjualan per Kategori siap diunduh kapan pun untuk evaluasi bisnis atau pajak.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/40 border border-white/5">
            <div className="p-2.5 rounded-xl bg-[#FE2C55]/15 text-[#FE2C55] shrink-0 mt-0.5">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">4. Efisiensi Biaya Iklan &amp; Top-Up Saldo</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Catat top-up saldo iklan Shopee Ads / TikTok Ads dan bandingkan langsung dengan penjualan yang didapat (ROAS aktual) agar tidak over-budget.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/40 border border-white/5 md:col-span-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">5. Keamanan Data Finansial &amp; Backup Cloud</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Data tersimpan aman di cloud Firestore terenkripsi dengan fallback IndexedDB lokal. Data tokomu milikmu seutuhnya dan tidak dibagikan ke pihak ketiga.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. KELEBIHAN & KEUNGGULAN (ADVANTAGES)                              */}
      {/* =================================================================== */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[11px] font-mono text-[#25F4EE] font-bold uppercase tracking-wider">
            KEUNGGULAN TEKNOLOGI
          </span>
          <h3 className="text-xl sm:text-3xl font-black text-white uppercase">
            Fitur Canggih yang Tidak Ada di Aplikasi Lain
          </h3>
          <p className="text-xs text-zinc-400">
            Menggabungkan akuntansi bisnis ritel profesional dengan kecepatan kasir kilat dan analisis keuangan mutakhir.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#25F4EE]/50 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Kasir POS & Struk Kilat</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pencatatan transaksi kasir secepat kilat dengan dukungan scan barcode, kalkulasi diskon, dan cetak struk bluetooth.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FE2C55]/50 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Audio Sci-Fi Robotik</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Efek suara tactile interaktif dan sapaan suara robotik yang menyapa nama toko secara personal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#25F4EE]/50 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#25F4EE]/10 text-[#25F4EE] flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">PWA Install di HP</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dapat diinstal langsung ke homescreen Android, iOS, maupun laptop tanpa perlu download dari app store.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#FE2C55]/50 transition-all space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FE2C55]/10 text-[#FE2C55] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Formula Biaya Terupdate</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Selalu diperbarui mengikuti skema perubahan tarif biaya administrasi marketplace Indonesia terbaru.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5. TIGA LANGKAH MUDAH MEMULAI                                       */}
      {/* =================================================================== */}
      <div className="spatial-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
        <h3 className="text-base sm:text-lg font-black text-white uppercase text-center">
          3 Langkah Cepat Mengontrol Finansial Tokomu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <div className="text-xs font-mono font-bold text-[#25F4EE]">LANGKAH 01</div>
            <h4 className="text-sm font-bold text-white">Masuk / Pilih Profil Toko</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Klik tombol Masuk Akun di atas, pilih toko yang tersedia atau login dengan akun Owner / Pegawai.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <div className="text-xs font-mono font-bold text-[#FE2C55]">LANGKAH 02</div>
            <h4 className="text-sm font-bold text-white">Input Transaksi &amp; Biaya</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Masukkan omzet pesanan harian, biaya iklan, ongkir, serta pengeluaran operasional toko.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
            <div className="text-xs font-mono font-bold text-[#25F4EE]">LANGKAH 03</div>
            <h4 className="text-sm font-bold text-white">Lihat Laba Bersih &amp; Evaluasi</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Dashboard otomatis menyajikan grafik pertumbuhan laba bersih, margin produk, dan neraca kas.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 6. CALL TO ACTION (CTA)                                             */}
      {/* =================================================================== */}
      <div className="spatial-card p-8 rounded-3xl border border-[#25F4EE]/40 text-center space-y-4 bg-gradient-to-b from-[#11131a] to-[#0a0b10] shadow-[0_0_40px_rgba(37,244,238,0.15)] relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#25F4EE] to-transparent animate-pulse" />

        <h3 className="text-xl sm:text-3xl font-black text-white uppercase">
          Siap Tingkatkan Profit &amp; Hentikan Boncos Tokomu?
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Gunakan Seller Profit sekarang. Buka dashboard tokomu dan nikmati kemudahan mencatat akuntansi marketplace tanpa rumus ribet.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleCtaClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#FE2C55] to-[#ff476d] hover:from-[#ff385e] hover:to-[#FE2C55] text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(254,44,85,0.5)] flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <span>Masuk ke Akun Toko</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
