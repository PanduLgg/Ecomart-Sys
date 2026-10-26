import React from 'react';

export const BuyerStorefrontFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12 pt-10 pb-8 px-4 sm:px-6 lg:px-8 text-slate-600">
      <div className="mx-auto max-w-7xl">
        {/* 4-Column E-Commerce Storefront Directory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-100">
          {/* Col 1: Store Brand & Identity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-xs shadow-xs">
                E
              </div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                EcoMart
              </span>
              <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-800">
                Official Store
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-1">
              Platform e-commerce resmi sekolah untuk kemudahan pemesanan seragam, buku paket, perlengkapan ATK, konsumsi sehat, dan layanan cetak dokumen sekolah.
            </p>
          </div>

          {/* Col 2: Kategori Belanja Utama */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Kategori Belanja
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-500">
              <li>Seragam Sekolah & Atribut Resmi</li>
              <li>Buku Pelajaran & Alat Tulis (ATK)</li>
              <li>Minuman Segar & Snack Sehat</li>
              <li>Layanan Cetak & Print Dokumen</li>
            </ul>
          </div>

          {/* Col 3: Pengambilan & Jam Toko */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Layanan Toko (Click & Collect)
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-500">
              <li>
                <span className="font-semibold text-slate-700">Jam Layanan: </span>
                06.45 – 15.30 WIB (Senin – Jumat)
              </li>
              <li>
                <span className="font-semibold text-slate-700">Lokasi: </span>
                Toko Fisik EcoMart (Gedung Koperasi)
              </li>
              <li>
                <span className="font-semibold text-slate-700">Status Stok: </span>
                Terverifikasi Real-Time
              </li>
            </ul>
          </div>

          {/* Col 4: Metode Pembayaran */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Pembayaran Resmi
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dukungan pembayaran digital instan melalui <strong>QRIS Nasional</strong> (m-Banking & E-Wallet) serta pembayaran <strong>Tunai</strong> langsung saat pengambilan barang di toko.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">QRIS</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">BCA</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">Mandiri</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">GoPay</span>
              <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium">Tunai</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Store Info */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© 2026 EcoMart Koperasi Sekolah. Seluruh hak cipta dilindungi.</p>
          <p className="text-[11px] text-slate-400">
            Katalog Belanja & Inventori Resmi Koperasi Sekolah
          </p>
        </div>
      </div>
    </footer>
  );
};
