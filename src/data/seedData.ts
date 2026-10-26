import type { EcomartDatabaseState, Product, ProductCategory } from '../types.ts';
import { generateDailyShiftCodes } from '../utils/billingLogic.ts';
import { getProductArtwork } from '../utils/productArtwork.ts';

/**
 * Generates a realistic, descriptive SVG illustration matching the product description
 * so product thumbnails load instantaneously with zero broken images.
 * Can be customized by the admin anytime.
 */
export function createProductSvgDataUri(
  title: string,
  category: ProductCategory,
  code: string
): string {
  return getProductArtwork(code, title, category);
}

/**
 * Generates a clean, authentic Indonesian QRIS standard visual illustration as a Data URI.
 */
export function createDefaultQrisSvgDataUri(
  merchantName: string = 'KOPERASI SEKOLAH ECOMART',
  nmid: string = 'ID1020039281729'
): string {
  const safeMerchant = merchantName.length > 28 ? `${merchantName.slice(0, 26)}...` : merchantName;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 460" width="360" height="460">
    <rect width="360" height="460" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
    
    <!-- Red QRIS Header Banner -->
    <path d="M0 16C0 7.16344 7.16344 0 16 0H344C352.837 0 360 7.16344 360 16V68H0V16Z" fill="#DC2626" />
    <text x="32" y="44" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" letter-spacing="2">QRIS</text>
    <rect x="108" y="24" width="46" height="24" rx="4" fill="#FFFFFF" fill-opacity="0.2" />
    <text x="131" y="40" font-family="sans-serif" font-size="11" font-weight="700" fill="#FFFFFF" text-anchor="middle">GPN</text>
    <text x="328" y="42" font-family="sans-serif" font-size="10" font-weight="600" fill="#FFFFFF" text-anchor="end" letter-spacing="0.5">PEMBAYARAN DIGITAL</text>
    
    <!-- Merchant Info Section -->
    <text x="180" y="98" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="800" fill="#0F172A" text-anchor="middle">${safeMerchant}</text>
    <text x="180" y="116" font-family="monospace" font-size="11" font-weight="600" fill="#64748B" text-anchor="middle">NMID: ${nmid}</text>
    
    <!-- QR Outer Box -->
    <rect x="50" y="132" width="260" height="260" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
    
    <!-- Position Detection Patterns (Finder Patterns) -->
    <!-- Top-Left -->
    <rect x="70" y="152" width="60" height="60" rx="6" fill="#0F172A" />
    <rect x="78" y="160" width="44" height="44" rx="4" fill="#FFFFFF" />
    <rect x="86" y="168" width="28" height="28" rx="2" fill="#0F172A" />
    
    <!-- Top-Right -->
    <rect x="230" y="152" width="60" height="60" rx="6" fill="#0F172A" />
    <rect x="238" y="160" width="44" height="44" rx="4" fill="#FFFFFF" />
    <rect x="246" y="168" width="28" height="28" rx="2" fill="#0F172A" />
    
    <!-- Bottom-Left -->
    <rect x="70" y="312" width="60" height="60" rx="6" fill="#0F172A" />
    <rect x="78" y="320" width="44" height="44" rx="4" fill="#FFFFFF" />
    <rect x="86" y="328" width="28" height="28" rx="2" fill="#0F172A" />
    
    <!-- Simulated High-Density QR Data Matrix -->
    <g fill="#0F172A">
      <rect x="145" y="152" width="10" height="10" />
      <rect x="165" y="152" width="10" height="10" />
      <rect x="185" y="152" width="10" height="10" />
      <rect x="205" y="152" width="10" height="10" />
      
      <rect x="145" y="172" width="10" height="20" />
      <rect x="175" y="172" width="20" height="10" />
      <rect x="205" y="172" width="10" height="10" />
      
      <rect x="135" y="202" width="20" height="10" />
      <rect x="165" y="202" width="10" height="20" />
      <rect x="185" y="192" width="10" height="20" />
      <rect x="205" y="202" width="20" height="10" />
      
      <!-- Center GPN Logo Spot -->
      <rect x="160" y="242" width="40" height="40" rx="8" fill="#DC2626" />
      <text x="180" y="267" font-family="sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" text-anchor="middle">GPN</text>
      
      <rect x="70" y="232" width="10" height="20" />
      <rect x="90" y="222" width="20" height="10" />
      <rect x="115" y="242" width="20" height="10" />
      <rect x="70" y="262" width="20" height="10" />
      <rect x="100" y="272" width="10" height="20" />
      <rect x="125" y="262" width="20" height="20" />
      
      <rect x="220" y="232" width="20" height="10" />
      <rect x="250" y="222" width="20" height="20" />
      <rect x="280" y="242" width="10" height="20" />
      <rect x="220" y="262" width="10" height="20" />
      <rect x="240" y="272" width="20" height="10" />
      <rect x="270" y="272" width="20" height="10" />
      
      <rect x="145" y="302" width="20" height="10" />
      <rect x="175" y="292" width="10" height="20" />
      <rect x="195" y="312" width="20" height="10" />
      <rect x="145" y="332" width="10" height="20" />
      <rect x="165" y="342" width="30" height="10" />
      <rect x="205" y="332" width="10" height="20" />
      <rect x="145" y="362" width="20" height="10" />
      <rect x="185" y="362" width="30" height="10" />
      
      <rect x="230" y="312" width="10" height="20" />
      <rect x="250" y="302" width="20" height="10" />
      <rect x="280" y="312" width="10" height="20" />
      <rect x="240" y="332" width="30" height="10" />
      <rect x="230" y="352" width="20" height="20" />
      <rect x="260" y="352" width="30" height="10" />
    </g>
    
    <!-- Footer Note -->
    <text x="180" y="420" font-family="sans-serif" font-size="10" font-weight="700" fill="#0F172A" text-anchor="middle">SATU QRIS UNTUK SEMUA PEMBAYARAN</text>
    <text x="180" y="436" font-family="sans-serif" font-size="8" font-weight="500" fill="#94A3B8" text-anchor="middle">A.S.P.I. · Bank Indonesia · Koperasi Ecomart</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createInitialDatabaseState(): EcomartDatabaseState {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const businessDate = `${y}-${m}-${d}`;
  const shiftCodes = generateDailyShiftCodes(businessDate, 0);

  const defaultQrisConfig = {
    imageUrl: createDefaultQrisSvgDataUri('KOPERASI SEKOLAH ECOMART', 'ID1020039281729'),
    accountName: 'KOPERASI SEKOLAH ECOMART',
    merchantNmid: 'ID1020039281729',
    instructionText:
      '1. Buka aplikasi m-Banking atau e-wallet (GoPay, OVO, DANA, ShopeePay, BCA, dll).\n2. Scan kode QRIS Koperasi di atas.\n3. Masukkan nominal uang tepat sesuai total belanja kasir.\n4. Tunjukkan bukti pembayaran sukses ke petugas kasir untuk cetak struk.',
    updatedAt: `${businessDate}T07:00:00.000Z`,
    updatedBy: 'Ibu Ratna (Admin Koperasi)',
  };

  const products: Product[] = [
    // 1. Minuman
    {
      id: 'prod-min-01',
      sku: 'MIN-001',
      name: 'Air Mineral Botol 600ml',
      category: 'Minuman',
      price: 3500,
      costPrice: 2400,
      stock: 64,
      minStock: 15,
      unit: 'botol',
      imageUrl: createProductSvgDataUri('Air Mineral 600ml', 'Minuman', 'MIN-001'),
      totalSoldAllTime: 310,
      lastSoldAt: '2026-10-15T09:15:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Air mineral dingin/biasa kemasan botol 600ml.',
    },
    {
      id: 'prod-min-02',
      sku: 'MIN-002',
      name: 'Teh Melati Dingin 350ml',
      category: 'Minuman',
      price: 4000,
      costPrice: 2900,
      stock: 42,
      minStock: 12,
      unit: 'botol',
      imageUrl: createProductSvgDataUri('Teh Melati 350ml', 'Minuman', 'MIN-002'),
      totalSoldAllTime: 245,
      lastSoldAt: '2026-10-15T09:42:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Minuman teh melati segar favorit jam istirahat.',
    },
    {
      id: 'prod-min-03',
      sku: 'MIN-003',
      name: 'Susu UHT Cokelat 250ml',
      category: 'Minuman',
      price: 6500,
      costPrice: 5100,
      stock: 30,
      minStock: 10,
      unit: 'kotak',
      imageUrl: createProductSvgDataUri('Susu UHT Cokelat', 'Minuman', 'MIN-003'),
      totalSoldAllTime: 188,
      lastSoldAt: '2026-10-15T08:50:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Susu UHT rasa cokelat full cream 250ml.',
    },

    // 2. Makanan
    {
      id: 'prod-mak-01',
      sku: 'MAK-001',
      name: 'Roti Lapis Cokelat Keju',
      category: 'Makanan',
      price: 6000,
      costPrice: 4500,
      stock: 28,
      minStock: 8,
      unit: 'bungkus',
      imageUrl: createProductSvgDataUri('Roti Cokelat Keju', 'Makanan', 'MAK-001'),
      totalSoldAllTime: 164,
      lastSoldAt: '2026-10-15T09:20:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Roti lembut isi cokelat lumer dan keju parut.',
    },
    {
      id: 'prod-mak-02',
      sku: 'MAK-002',
      name: 'Biskuit Gandum Sachet',
      category: 'Makanan',
      price: 3000,
      costPrice: 2100,
      stock: 48,
      minStock: 12,
      unit: 'bungkus',
      imageUrl: createProductSvgDataUri('Biskuit Gandum', 'Makanan', 'MAK-002'),
      totalSoldAllTime: 112,
      lastSoldAt: '2026-10-14T13:10:00.000Z',
      updatedAt: '2026-10-14T13:10:00.000Z',
      description: 'Camilan biskuit gandum sehat pengganjal lapar.',
    },
    {
      id: 'prod-mak-03',
      sku: 'MAK-003',
      name: 'Keripik Singkong Balado 80g',
      category: 'Makanan',
      price: 5000,
      costPrice: 3600,
      stock: 26,
      minStock: 8,
      unit: 'bungkus',
      imageUrl: createProductSvgDataUri('Keripik Singkong', 'Makanan', 'MAK-003'),
      totalSoldAllTime: 1,
      lastSoldAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-18T10:00:00.000Z',
      description: 'Keripik singkong pedas manis kemasan 80 gram.',
    },

    // 3. Makanan Stok Terbatas (Titipan Harian / Cepat Habis)
    {
      id: 'prod-lim-01',
      sku: 'LIM-001',
      name: 'Nasi Bakar Ayam Suwir Kemangi',
      category: 'Makanan Stok Terbatas',
      price: 12000,
      costPrice: 9500,
      stock: 6,
      minStock: 5,
      unit: 'porsi',
      imageUrl: createProductSvgDataUri('Nasi Bakar Ayam', 'Makanan Stok Terbatas', 'LIM-001'),
      totalSoldAllTime: 215,
      lastSoldAt: '2026-10-15T09:50:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Kuota harian 25 porsi. Hangat setiap pagi jam 07.00.',
    },
    {
      id: 'prod-lim-02',
      sku: 'LIM-002',
      name: 'Risol Mayo Smoked Beef (Isi 2)',
      category: 'Makanan Stok Terbatas',
      price: 7000,
      costPrice: 5200,
      stock: 4,
      minStock: 6,
      unit: 'mika',
      imageUrl: createProductSvgDataUri('Risol Mayo Beef', 'Makanan Stok Terbatas', 'LIM-002'),
      totalSoldAllTime: 290,
      lastSoldAt: '2026-10-15T09:55:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Risol mayo lumer titipan katering koperasi, stok harian terbatas.',
    },
    {
      id: 'prod-lim-03',
      sku: 'LIM-003',
      name: 'Salad Buah Cup Segar 200ml',
      category: 'Makanan Stok Terbatas',
      price: 10000,
      costPrice: 7500,
      stock: 8,
      minStock: 5,
      unit: 'cup',
      imageUrl: createProductSvgDataUri('Salad Buah Cup', 'Makanan Stok Terbatas', 'LIM-003'),
      totalSoldAllTime: 94,
      lastSoldAt: '2026-10-15T09:10:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Potongan apel, anggur, melon, dan saus yogurt keju segar.',
    },

    // 4. Jasa Print Perkertas (Hitam Putih & Berwarna)
    {
      id: 'prod-prt-01',
      sku: 'PRT-BW1',
      name: 'Jasa Print HVS A4/F4 — Hitam Putih',
      category: 'Jasa Print',
      price: 500,
      costPrice: 200,
      stock: 480,
      minStock: 100,
      unit: 'lembar',
      imageUrl: createProductSvgDataUri('Print Hitam Putih', 'Jasa Print', 'PRT-BW1'),
      totalSoldAllTime: 1420,
      lastSoldAt: '2026-10-15T09:48:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Cetak dokumen tugas/makalah per lembar tinta hitam putih.',
    },
    {
      id: 'prod-prt-02',
      sku: 'PRT-CL1',
      name: 'Jasa Print HVS A4/F4 — Berwarna',
      category: 'Jasa Print',
      price: 1500,
      costPrice: 650,
      stock: 340,
      minStock: 80,
      unit: 'lembar',
      imageUrl: createProductSvgDataUri('Print Berwarna', 'Jasa Print', 'PRT-CL1'),
      totalSoldAllTime: 680,
      lastSoldAt: '2026-10-15T09:48:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Cetak dokumen grafik/gambar per lembar tinta warna tajam.',
    },
    {
      id: 'prod-prt-03',
      sku: 'PRT-FCL',
      name: 'Jasa Print Full Color / Kertas Foto',
      category: 'Jasa Print',
      price: 3500,
      costPrice: 1800,
      stock: 95,
      minStock: 20,
      unit: 'lembar',
      imageUrl: createProductSvgDataUri('Print Full Color', 'Jasa Print', 'PRT-FCL'),
      totalSoldAllTime: 150,
      lastSoldAt: '2026-10-14T11:20:00.000Z',
      updatedAt: '2026-10-14T11:20:00.000Z',
      description: 'Cetak poster/foto tugas siswa dengan tinta warna penuh.',
    },

    // 5. Produk ATK (Alat Tulis Kantor & Sekolah)
    {
      id: 'prod-atk-01',
      sku: 'ATK-001',
      name: 'Buku Tulis Koperasi 58 Lembar',
      category: 'ATK',
      price: 5500,
      costPrice: 4000,
      stock: 75,
      minStock: 20,
      unit: 'buku',
      imageUrl: createProductSvgDataUri('Buku Tulis 58 Lbr', 'ATK', 'ATK-001'),
      totalSoldAllTime: 410,
      lastSoldAt: '2026-10-15T08:15:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Buku tulis bergaris berlogo sekolah kualitas kertas tebal.',
    },
    {
      id: 'prod-atk-02',
      sku: 'ATK-002',
      name: 'Pulpen Gel Hitam 0.5mm',
      category: 'ATK',
      price: 3500,
      costPrice: 2300,
      stock: 90,
      minStock: 25,
      unit: 'pcs',
      imageUrl: createProductSvgDataUri('Pulpen Gel 0.5mm', 'ATK', 'ATK-002'),
      totalSoldAllTime: 530,
      lastSoldAt: '2026-10-15T09:30:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Pulpen tinta gel hitam anti macet untuk ujian dan catatan.',
    },
    {
      id: 'prod-atk-03',
      sku: 'ATK-003',
      name: 'Busur Derajat & Jangka Besi Set',
      category: 'ATK',
      price: 18500,
      costPrice: 14000,
      stock: 24,
      minStock: 5,
      unit: 'set',
      imageUrl: createProductSvgDataUri('Set Jangka Besi', 'ATK', 'ATK-003'),
      totalSoldAllTime: 2,
      lastSoldAt: '2026-09-10T10:00:00.000Z',
      updatedAt: '2026-09-10T10:00:00.000Z',
      description: 'Set jangka besi matematika (Jarang laku di luar awal semester).',
    },

    // 6. Atribut Baju Seragam Siswa
    {
      id: 'prod-srg-01',
      sku: 'SRG-001',
      name: 'Dasi Sekolah Bordir Logo (SMA/SMK)',
      category: 'Atribut Seragam',
      price: 15000,
      costPrice: 10500,
      stock: 35,
      minStock: 10,
      unit: 'pcs',
      imageUrl: createProductSvgDataUri('Dasi Sekolah Logo', 'Atribut Seragam', 'SRG-001'),
      totalSoldAllTime: 145,
      lastSoldAt: '2026-10-15T07:25:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Dasi seragam resmi dengan bordir logo sekolah.',
    },
    {
      id: 'prod-srg-02',
      sku: 'SRG-002',
      name: 'Topi Upacara Bordir Putih Abu',
      category: 'Atribut Seragam',
      price: 22000,
      costPrice: 16000,
      stock: 28,
      minStock: 8,
      unit: 'pcs',
      imageUrl: createProductSvgDataUri('Topi Upacara', 'Atribut Seragam', 'SRG-002'),
      totalSoldAllTime: 132,
      lastSoldAt: '2026-10-13T07:10:00.000Z',
      updatedAt: '2026-10-13T07:10:00.000Z',
      description: 'Topi upacara hari Senin bahan drill nyaman dengan pengait belakang.',
    },
    {
      id: 'prod-srg-03',
      sku: 'SRG-003',
      name: 'Kaos Kaki Logo Sekolah Putih Hitam',
      category: 'Atribut Seragam',
      price: 12000,
      costPrice: 8000,
      stock: 44,
      minStock: 12,
      unit: 'pasang',
      imageUrl: createProductSvgDataUri('Kaos Kaki Sekolah', 'Atribut Seragam', 'SRG-003'),
      totalSoldAllTime: 198,
      lastSoldAt: '2026-10-15T07:40:00.000Z',
      updatedAt: '2026-10-15T07:00:00.000Z',
      description: 'Kaos kaki tebal berlogo resmi sekolah telapak hitam.',
    },
    {
      id: 'prod-srg-04',
      sku: 'SRG-004',
      name: 'Sabuk Ikat Pinggang Gesper Sekolah',
      category: 'Atribut Seragam',
      price: 25000,
      costPrice: 18500,
      stock: 19,
      minStock: 6,
      unit: 'pcs',
      imageUrl: createProductSvgDataUri('Sabuk Sekolah', 'Atribut Seragam', 'SRG-004'),
      totalSoldAllTime: 1,
      lastSoldAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-05T09:00:00.000Z',
      description: 'Sabuk ikat pinggang kepala kuningan berlogo sekolah.',
    },
  ];

  return {
    currentBusinessDate: businessDate,
    lastClosingTimestamp: new Date().toISOString(),
    dailyShiftCodes: shiftCodes,
    activeShifts: {
      inside: {
        area: 'Kasir Area Dalam',
        cashierName: 'Nadia Putri (Shift Pagi)',
        loginAt: '2026-10-15T07:05:00.000Z',
        shiftCode: shiftCodes.insideCode,
        isActive: true,
      },
      outside: {
        area: 'Kasir Area Luar',
        cashierName: 'Rizky Pratama (Shift Istirahat)',
        loginAt: '2026-10-15T09:00:00.000Z',
        shiftCode: shiftCodes.outsideCode,
        isActive: true,
      },
    },
    products,
    transactions: [
      {
        id: 'TRX-20261015-004',
        invoiceNumber: 'INV/20261015/004',
        createdAt: '2026-10-15T09:52:00.000Z',
        businessDate: '2026-10-15',
        cashierAccount: 'Kasir Area Luar',
        cashierName: 'Rizky Pratama (Shift Istirahat)',
        shiftCodeUsed: shiftCodes.outsideCode,
        buyerLabel: 'Siswa Kelas XI IPA 2',
        items: [
          {
            productId: 'prod-lim-01',
            sku: 'LIM-001',
            name: 'Nasi Bakar Ayam Suwir Kemangi',
            category: 'Makanan Stok Terbatas',
            price: 12000,
            quantity: 2,
            unit: 'porsi',
          },
          {
            productId: 'prod-min-02',
            sku: 'MIN-002',
            name: 'Teh Melati Dingin 350ml',
            category: 'Minuman',
            price: 4000,
            quantity: 2,
            unit: 'botol',
          },
        ],
        totalAmount: 32000,
        cashReceived: 50000,
        changeAmount: 18000,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
      {
        id: 'TRX-20261015-003',
        invoiceNumber: 'INV/20261015/003',
        createdAt: '2026-10-15T09:48:00.000Z',
        businessDate: '2026-10-15',
        cashierAccount: 'Kasir Area Dalam',
        cashierName: 'Nadia Putri (Shift Pagi)',
        shiftCodeUsed: shiftCodes.insideCode,
        buyerLabel: 'Siswa Kelas XII IPS 1',
        items: [
          {
            productId: 'prod-prt-01',
            sku: 'PRT-BW1',
            name: 'Jasa Print HVS A4/F4 — Hitam Putih',
            category: 'Jasa Print',
            price: 500,
            quantity: 14,
            unit: 'lembar',
            notes: 'Makalah Sejarah 14 halaman',
          },
          {
            productId: 'prod-prt-02',
            sku: 'PRT-CL1',
            name: 'Jasa Print HVS A4/F4 — Berwarna',
            category: 'Jasa Print',
            price: 1500,
            quantity: 2,
            unit: 'lembar',
            notes: 'Cover & Lampiran Grafik',
          },
          {
            productId: 'prod-atk-02',
            sku: 'ATK-002',
            name: 'Pulpen Gel Hitam 0.5mm',
            category: 'ATK',
            price: 3500,
            quantity: 1,
            unit: 'pcs',
          },
        ],
        totalAmount: 13500,
        cashReceived: 15000,
        changeAmount: 1500,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
      {
        id: 'TRX-20261015-002',
        invoiceNumber: 'INV/20261015/002',
        createdAt: '2026-10-15T09:15:00.000Z',
        businessDate: '2026-10-15',
        cashierAccount: 'Kasir Area Luar',
        cashierName: 'Rizky Pratama (Shift Istirahat)',
        shiftCodeUsed: shiftCodes.outsideCode,
        buyerLabel: 'Guru Piket',
        items: [
          {
            productId: 'prod-lim-02',
            sku: 'LIM-002',
            name: 'Risol Mayo Smoked Beef (Isi 2)',
            category: 'Makanan Stok Terbatas',
            price: 7000,
            quantity: 3,
            unit: 'mika',
          },
          {
            productId: 'prod-min-01',
            sku: 'MIN-001',
            name: 'Air Mineral Botol 600ml',
            category: 'Minuman',
            price: 3500,
            quantity: 2,
            unit: 'botol',
          },
        ],
        totalAmount: 28000,
        cashReceived: 30000,
        changeAmount: 2000,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
      {
        id: 'TRX-20261015-001',
        invoiceNumber: 'INV/20261015/001',
        createdAt: '2026-10-15T07:25:00.000Z',
        businessDate: '2026-10-15',
        cashierAccount: 'Kasir Area Dalam',
        cashierName: 'Nadia Putri (Shift Pagi)',
        shiftCodeUsed: shiftCodes.insideCode,
        buyerLabel: 'Siswa Kelas X-3',
        items: [
          {
            productId: 'prod-srg-01',
            sku: 'SRG-001',
            name: 'Dasi Sekolah Bordir Logo (SMA/SMK)',
            category: 'Atribut Seragam',
            price: 15000,
            quantity: 1,
            unit: 'pcs',
          },
          {
            productId: 'prod-srg-03',
            sku: 'SRG-003',
            name: 'Kaos Kaki Logo Sekolah Putih Hitam',
            category: 'Atribut Seragam',
            price: 12000,
            quantity: 1,
            unit: 'pasang',
          },
        ],
        totalAmount: 27000,
        cashReceived: 30000,
        changeAmount: 3000,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
      // Previous days transactions for Weekly & Monthly Analytics
      {
        id: 'TRX-20261014-019',
        invoiceNumber: 'INV/20261014/019',
        createdAt: '2026-10-14T13:10:00.000Z',
        businessDate: '2026-10-14',
        cashierAccount: 'Kasir Area Dalam',
        cashierName: 'Fajar Ramadhan (Shift Siang)',
        shiftCodeUsed: 'DLM-8192',
        buyerLabel: 'Siswa Kelas XI',
        items: [
          {
            productId: 'prod-prt-01',
            sku: 'PRT-BW1',
            name: 'Jasa Print HVS A4/F4 — Hitam Putih',
            category: 'Jasa Print',
            price: 500,
            quantity: 35,
            unit: 'lembar',
          },
          {
            productId: 'prod-atk-01',
            sku: 'ATK-001',
            name: 'Buku Tulis Koperasi 58 Lembar',
            category: 'ATK',
            price: 5500,
            quantity: 4,
            unit: 'buku',
          },
        ],
        totalAmount: 39500,
        cashReceived: 50000,
        changeAmount: 10500,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
      {
        id: 'TRX-20261011-012',
        invoiceNumber: 'INV/20261011/012',
        createdAt: '2026-10-11T10:15:00.000Z',
        businessDate: '2026-10-11',
        cashierAccount: 'Kasir Area Luar',
        cashierName: 'Siti Aisyah (Shift Pagi)',
        shiftCodeUsed: 'LUR-6401',
        buyerLabel: 'Siswa Kelas X',
        items: [
          {
            productId: 'prod-lim-01',
            sku: 'LIM-001',
            name: 'Nasi Bakar Ayam Suwir Kemangi',
            category: 'Makanan Stok Terbatas',
            price: 12000,
            quantity: 5,
            unit: 'porsi',
          },
          {
            productId: 'prod-min-03',
            sku: 'MIN-003',
            name: 'Susu UHT Cokelat 250ml',
            category: 'Minuman',
            price: 6500,
            quantity: 4,
            unit: 'kotak',
          },
        ],
        totalAmount: 86000,
        cashReceived: 100000,
        changeAmount: 14000,
        paymentMethod: 'Tunai',
        status: 'Selesai',
      },
    ],
    activityLogs: [
      {
        id: 'LOG-1004',
        timestamp: '2026-10-15T09:52:00.000Z',
        actorRole: 'kasir',
        actorName: 'Rizky Pratama (Shift Istirahat)',
        cashierArea: 'Kasir Area Luar',
        actionType: 'TRANSAKSI_BARU',
        summary: 'Input Penjualan INV/20261015/004 — Rp 32.000',
        details: '2x Nasi Bakar Ayam Suwir Kemangi, 2x Teh Melati Dingin 350ml. Tunai Rp 50.000, Kembali Rp 18.000.',
      },
      {
        id: 'LOG-1003',
        timestamp: '2026-10-15T09:48:00.000Z',
        actorRole: 'kasir',
        actorName: 'Nadia Putri (Shift Pagi)',
        cashierArea: 'Kasir Area Dalam',
        actionType: 'TRANSAKSI_BARU',
        summary: 'Input Penjualan INV/20261015/003 — Rp 13.500',
        details: '14x Jasa Print Hitam Putih, 2x Jasa Print Berwarna, 1x Pulpen Gel Hitam 0.5mm.',
      },
      {
        id: 'LOG-1002',
        timestamp: '2026-10-15T09:00:00.000Z',
        actorRole: 'kasir',
        actorName: 'Rizky Pratama (Shift Istirahat)',
        cashierArea: 'Kasir Area Luar',
        actionType: 'LOGIN_SHIFT',
        summary: 'Login Shift Kasir Area Luar terverifikasi',
        details: `Verifikasi kode akses harian ${shiftCodes.outsideCode} berhasil untuk terminal Kasir Area Luar.`,
      },
      {
        id: 'LOG-1001',
        timestamp: '2026-10-15T07:05:00.000Z',
        actorRole: 'kasir',
        actorName: 'Nadia Putri (Shift Pagi)',
        cashierArea: 'Kasir Area Dalam',
        actionType: 'LOGIN_SHIFT',
        summary: 'Login Shift Kasir Area Dalam terverifikasi',
        details: `Verifikasi kode akses harian ${shiftCodes.insideCode} berhasil untuk terminal Kasir Area Dalam.`,
      },
    ],
    closingHistory: [
      {
        id: 'CLS-20261014',
        closedAt: '2026-10-14T16:15:00.000Z',
        businessDate: '2026-10-14',
        closedByAdmin: 'Ibu Ratna (Admin Koperasi)',
        totalTransactions: 28,
        totalRevenue: 642500,
        totalItemsSold: 134,
        insideAreaRevenue: 358500,
        outsideAreaRevenue: 284000,
        cashierNamesInvolved: [
          'Fajar Ramadhan (Kasir Area Dalam)',
          'Dinda Kirana (Kasir Area Luar)',
        ],
        lowStockProductsCount: 2,
        notes: 'Rekonsiliasi kas fisik Area Dalam & Area Luar klop 100%. Restock kue basah & nasi bakar dijadwalkan besok jam 06.30.',
      },
    ],
    qrisConfig: defaultQrisConfig,
    storeStatus: {
      status: 'BUKA',
      note: '06.45 – 15.30 WIB (Senin – Jumat)',
      updatedAt: '2026-10-15T06:45:00.000Z',
      updatedBy: 'Sistem Koperasi',
    },
  };
}
