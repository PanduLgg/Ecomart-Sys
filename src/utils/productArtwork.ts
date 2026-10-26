/**
 * Professional temporary product illustration generator for EcoMart School Cooperative.
 * Generates crisp, realistic, self-contained SVG artwork matching each product description.
 * Ensures zero broken image links and instant loading across all devices.
 * Can be freely replaced by real product photos uploaded by the Admin.
 */

export function getProductArtwork(
  sku: string,
  name: string = '',
  category: string = ''
): string {
  const cleanSku = (sku || '').toUpperCase().trim();
  const lowerName = (name || '').toLowerCase();

  // 1. Minuman: Air Mineral Botol 600ml
  if (cleanSku === 'MIN-001' || lowerName.includes('mineral')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#E0F2FE"/>
          <stop offset="100%" stop-color="#BAE6FD"/>
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="50%" stop-color="#0284C7"/>
          <stop offset="100%" stop-color="#0369A1"/>
        </linearGradient>
        <linearGradient id="bottle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.8"/>
          <stop offset="30%" stop-color="#E0F2FE" stop-opacity="0.5"/>
          <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#93C5FD" stop-opacity="0.6"/>
        </linearGradient>
        <filter id="drop" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0284C7" flood-opacity="0.25"/>
        </filter>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <circle cx="160" cy="185" r="45" fill="#0284C7" fill-opacity="0.12" filter="blur(4px)"/>
      
      <!-- Water bottle silhouette -->
      <g filter="url(#drop)">
        <!-- Cap -->
        <rect x="146" y="32" width="28" height="14" rx="3" fill="#0284C7"/>
        <line x1="149" y1="36" x2="171" y2="36" stroke="#38BDF8" stroke-width="1.5"/>
        <rect x="148" y="46" width="24" height="4" fill="#0369A1"/>
        <!-- Neck -->
        <path d="M150 50 L150 62 L136 78 L136 172 Q136 182 146 182 L174 182 Q184 182 184 172 L184 78 L170 62 L170 50 Z" fill="url(#bottle)" stroke="#93C5FD" stroke-width="1.5"/>
        <!-- Water level inside -->
        <path d="M138 90 C148 88 172 92 182 90 L182 172 Q182 180 174 180 L146 180 Q138 180 138 172 Z" fill="url(#water)" fill-opacity="0.85"/>
        <!-- Water reflection wave -->
        <path d="M142 98 Q160 92 178 98 L178 105 Q160 99 142 105 Z" fill="#FFFFFF" fill-opacity="0.5"/>
        <!-- Product Label -->
        <rect x="135" y="116" width="50" height="36" rx="2" fill="#FFFFFF" stroke="#0284C7" stroke-width="0.8"/>
        <rect x="137" y="118" width="46" height="8" fill="#0284C7"/>
        <text x="160" y="124" font-family="sans-serif" font-size="5.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">AIR MINERAL</text>
        <text x="160" y="136" font-family="sans-serif" font-size="7" font-weight="800" fill="#0369A1" text-anchor="middle">EcoPure</text>
        <text x="160" y="146" font-family="monospace" font-size="5.5" font-weight="700" fill="#0284C7" text-anchor="middle">600 ML</text>
        <!-- Highlight glare -->
        <path d="M140 76 L143 78 L143 172 L140 170 Z" fill="#FFFFFF" fill-opacity="0.6"/>
        <!-- Condensation droplets -->
        <circle cx="178" cy="84" r="1.5" fill="#FFFFFF" fill-opacity="0.9"/>
        <circle cx="176" cy="110" r="1.2" fill="#FFFFFF" fill-opacity="0.9"/>
        <circle cx="179" cy="162" r="1.8" fill="#FFFFFF" fill-opacity="0.9"/>
      </g>
      <!-- Bottom Badge -->
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#0284C7" fill-opacity="0.12"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#0369A1" text-anchor="middle">MINUMAN SEGAR</text>
    `);
  }

  // 2. Minuman: Teh Melati Dingin 350ml
  if (cleanSku === 'MIN-002' || lowerName.includes('teh')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FEF3C7"/>
          <stop offset="100%" stop-color="#FDE68A"/>
        </linearGradient>
        <linearGradient id="tea" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#F59E0B"/>
          <stop offset="50%" stop-color="#D97706"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="186" rx="42" ry="10" fill="#B45309" fill-opacity="0.15"/>
      <!-- Bottle -->
      <g>
        <!-- Cap -->
        <rect x="147" y="38" width="26" height="14" rx="3" fill="#15803D"/>
        <!-- Neck & Body -->
        <path d="M151 52 L151 64 L138 78 L138 174 Q138 182 148 182 L172 182 Q182 182 182 174 L182 78 L169 64 L169 52 Z" fill="#FFFFFF" fill-opacity="0.85" stroke="#F59E0B" stroke-width="1.2"/>
        <!-- Tea Liquid -->
        <path d="M140 84 C150 82 170 86 180 84 L180 173 Q180 180 172 180 L148 180 Q140 180 140 173 Z" fill="url(#tea)"/>
        <!-- Ice Cubes inside -->
        <rect x="146" y="98" width="14" height="14" rx="2" fill="#FFFFFF" fill-opacity="0.45" transform="rotate(12 153 105)"/>
        <rect x="160" y="130" width="13" height="13" rx="2" fill="#FFFFFF" fill-opacity="0.45" transform="rotate(-8 166 136)"/>
        <!-- Label -->
        <rect x="136" y="112" width="48" height="34" rx="2" fill="#166534"/>
        <text x="160" y="123" font-family="sans-serif" font-size="6" font-weight="900" fill="#FEF08A" text-anchor="middle">TEH MELATI</text>
        <text x="160" y="132" font-family="sans-serif" font-size="8" font-weight="800" fill="#FFFFFF" text-anchor="middle">JASMINE</text>
        <text x="160" y="141" font-family="sans-serif" font-size="5" font-weight="700" fill="#BBF7D0" text-anchor="middle">DINGIN 350ml</text>
        <!-- Tea Leaves icon on top -->
        <path d="M182 66 Q194 60 192 72 Q182 76 182 66 Z" fill="#16A34A"/>
        <path d="M192 72 Q202 70 200 80 Q190 82 192 72 Z" fill="#22C55E"/>
      </g>
      <rect x="18" y="18" width="76" height="20" rx="6" fill="#D97706" fill-opacity="0.16"/>
      <text x="56" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#92400E" text-anchor="middle">TEH DINGIN</text>
    `);
  }

  // 3. Minuman: Susu UHT Cokelat 250ml
  if (cleanSku === 'MIN-003' || lowerName.includes('susu')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FDF2F8"/>
          <stop offset="100%" stop-color="#FCE7F3"/>
        </linearGradient>
        <linearGradient id="box" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#78350F"/>
          <stop offset="60%" stop-color="#92400E"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="188" rx="46" ry="10" fill="#78350F" fill-opacity="0.16"/>
      <!-- Straw -->
      <path d="M174 30 L168 56" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
      <path d="M174 30 L184 26" stroke="#EF4444" stroke-width="4" stroke-linecap="round"/>
      <!-- Milk Carton Top Roof -->
      <polygon points="130,76 160,54 190,76" fill="#B45309"/>
      <polygon points="126,76 160,54 156,50 122,72" fill="#78350F"/>
      <!-- Carton Body -->
      <rect x="130" y="76" width="60" height="104" rx="3" fill="url(#box)"/>
      <!-- White Splash graphic -->
      <path d="M130 110 Q145 125 160 112 Q175 102 190 118 L190 150 Q175 138 160 148 Q145 158 130 140 Z" fill="#FFFFFF"/>
      <text x="160" y="98" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#FEF3C7" text-anchor="middle">REAL COCOA</text>
      <text x="160" y="132" font-family="sans-serif" font-size="10" font-weight="900" fill="#78350F" text-anchor="middle">SUSU UHT</text>
      <text x="160" y="142" font-family="sans-serif" font-size="6.5" font-weight="800" fill="#92400E" text-anchor="middle">COKELAT 250ml</text>
      <!-- Cow patch -->
      <circle cx="145" cy="165" r="5" fill="#78350F" fill-opacity="0.3"/>
      <circle cx="172" cy="168" r="6" fill="#78350F" fill-opacity="0.3"/>
      <rect x="18" y="18" width="76" height="20" rx="6" fill="#78350F" fill-opacity="0.14"/>
      <text x="56" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#78350F" text-anchor="middle">SUSU COKELAT</text>
    `);
  }

  // 4. Makanan: Roti Lapis Cokelat Keju
  if (cleanSku === 'MAK-001' || lowerName.includes('roti')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFBEB"/>
          <stop offset="100%" stop-color="#FEF3C7"/>
        </linearGradient>
        <linearGradient id="toast" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#D97706"/>
          <stop offset="40%" stop-color="#FBBF24"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="184" rx="55" ry="12" fill="#B45309" fill-opacity="0.18"/>
      <!-- Toast slice bottom -->
      <path d="M105 130 C105 110 120 105 135 110 C150 102 170 102 185 110 C200 105 215 110 215 130 L212 165 C212 172 205 176 195 176 L125 176 C115 176 108 172 108 165 Z" fill="#FDE68A" stroke="#B45309" stroke-width="3"/>
      <!-- Melted Chocolate Layer -->
      <path d="M108 138 Q130 148 160 138 Q190 150 212 140 L212 148 Q185 158 160 146 Q135 158 108 148 Z" fill="#451A03"/>
      <!-- Cheese curls / cheddar -->
      <rect x="125" y="142" width="22" height="6" rx="2" fill="#F59E0B" transform="rotate(-6 136 145)"/>
      <rect x="155" y="143" width="26" height="5" rx="2" fill="#FBBF24" transform="rotate(4 168 145)"/>
      <rect x="180" y="140" width="20" height="6" rx="2" fill="#F59E0B" transform="rotate(-10 190 143)"/>
      <!-- Toast slice top angled -->
      <path d="M108 105 C108 85 123 80 138 85 C153 77 173 77 188 85 C203 80 218 85 218 105 L215 132 C215 136 210 140 200 140 L126 140 C116 140 111 136 111 132 Z" fill="url(#toast)" stroke="#92400E" stroke-width="2.5"/>
      <!-- Grilled butter marks -->
      <line x1="130" y1="96" x2="152" y2="124" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="150" y1="92" x2="176" y2="124" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="172" y1="94" x2="198" y2="124" stroke="#78350F" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#D97706" fill-opacity="0.16"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#92400E" text-anchor="middle">ROTI BAKAR</text>
    `);
  }

  // 5. Makanan: Biskuit Gandum Sachet
  if (cleanSku === 'MAK-002' || lowerName.includes('biskuit')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FEF9C3"/>
          <stop offset="100%" stop-color="#FEF08A"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="182" rx="54" ry="12" fill="#A16207" fill-opacity="0.16"/>
      <!-- Back Biscuit -->
      <g transform="translate(130, 60) rotate(-14)">
        <rect width="70" height="70" rx="14" fill="#D97706" stroke="#92400E" stroke-width="2"/>
        <rect x="5" y="5" width="60" height="60" rx="10" fill="#F59E0B"/>
        <!-- Dimple holes -->
        <circle cx="20" cy="20" r="2" fill="#78350F"/>
        <circle cx="35" cy="20" r="2" fill="#78350F"/>
        <circle cx="50" cy="20" r="2" fill="#78350F"/>
        <circle cx="20" cy="35" r="2" fill="#78350F"/>
        <circle cx="35" cy="35" r="2" fill="#78350F"/>
        <circle cx="50" cy="35" r="2" fill="#78350F"/>
        <circle cx="20" cy="50" r="2" fill="#78350F"/>
        <circle cx="35" cy="50" r="2" fill="#78350F"/>
        <circle cx="50" cy="50" r="2" fill="#78350F"/>
      </g>
      <!-- Front Biscuit -->
      <g transform="translate(115, 85) rotate(8)">
        <rect width="76" height="76" rx="14" fill="#EAB308" stroke="#A16207" stroke-width="2.5"/>
        <rect x="6" y="6" width="64" height="64" rx="10" fill="#FDE047"/>
        <text x="38" y="42" font-family="sans-serif" font-size="8" font-weight="900" fill="#A16207" text-anchor="middle">WHEAT</text>
        <circle cx="22" cy="24" r="2.2" fill="#854D0E"/>
        <circle cx="54" cy="24" r="2.2" fill="#854D0E"/>
        <circle cx="22" cy="54" r="2.2" fill="#854D0E"/>
        <circle cx="54" cy="54" r="2.2" fill="#854D0E"/>
      </g>
      <!-- Wheat spike garnish -->
      <path d="M225 150 Q230 110 245 90" stroke="#CA8A04" stroke-width="2" fill="none"/>
      <ellipse cx="236" cy="115" rx="5" ry="2.5" fill="#EAB308" transform="rotate(-30 236 115)"/>
      <ellipse cx="242" cy="100" rx="5" ry="2.5" fill="#EAB308" transform="rotate(-30 242 100)"/>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#CA8A04" fill-opacity="0.18"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#854D0E" text-anchor="middle">BISKUIT GANDUM</text>
    `);
  }

  // 6. Makanan: Keripik Singkong Balado 80g
  if (cleanSku === 'MAK-003' || lowerName.includes('singkong') || lowerName.includes('keripik')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF1F2"/>
          <stop offset="100%" stop-color="#FFE4E6"/>
        </linearGradient>
        <linearGradient id="pouch" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#DC2626"/>
          <stop offset="60%" stop-color="#EF4444"/>
          <stop offset="100%" stop-color="#B91C1C"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="190" rx="50" ry="11" fill="#991B1B" fill-opacity="0.18"/>
      <!-- Foil snack pouch -->
      <g>
        <path d="M125 50 L195 50 L205 178 L115 178 Z" fill="url(#pouch)" stroke="#991B1B" stroke-width="1.5"/>
        <!-- Top sealed crimps -->
        <line x1="125" y1="56" x2="195" y2="56" stroke="#FEF2F2" stroke-width="1" stroke-dasharray="2 2"/>
        <!-- Center Banner -->
        <rect x="120" y="85" width="80" height="42" rx="4" fill="#FFFFFF"/>
        <text x="160" y="98" font-family="sans-serif" font-size="7" font-weight="900" fill="#DC2626" text-anchor="middle">KERIPIK SINGKONG</text>
        <text x="160" y="112" font-family="sans-serif" font-size="12" font-weight="900" fill="#991B1B" text-anchor="middle">BALADO</text>
        <text x="160" y="122" font-family="sans-serif" font-size="6" font-weight="800" fill="#EA580C" text-anchor="middle">PEDAS MANIS · 80G</text>
        <!-- Chili graphics -->
        <path d="M148 135 Q154 150 168 152 Q158 158 146 142 Z" fill="#DC2626"/>
        <path d="M148 135 Q146 130 143 132" stroke="#16A34A" stroke-width="1.5" fill="none"/>
        <!-- Chips illustration -->
        <ellipse cx="178" cy="148" rx="12" ry="7" fill="#FBBF24" stroke="#DC2626" stroke-width="1" transform="rotate(-15 178 148)"/>
      </g>
      <rect x="18" y="18" width="76" height="20" rx="6" fill="#DC2626" fill-opacity="0.14"/>
      <text x="56" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#991B1B" text-anchor="middle">SNACK PEDAS</text>
    `);
  }

  // 7. Makanan Stok Terbatas: Nasi Bakar Ayam Suwir Kemangi
  if (cleanSku === 'LIM-001' || lowerName.includes('nasi bakar')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F0FDF4"/>
          <stop offset="100%" stop-color="#DCFCE7"/>
        </linearGradient>
        <linearGradient id="leaf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#15803D"/>
          <stop offset="50%" stop-color="#166534"/>
          <stop offset="100%" stop-color="#14532D"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="180" rx="60" ry="12" fill="#14532D" fill-opacity="0.2"/>
      <!-- Banana leaf roll -->
      <g transform="translate(10, 5)">
        <rect x="90" y="110" width="120" height="48" rx="14" fill="url(#leaf)" stroke="#052E16" stroke-width="2"/>
        <!-- Banana leaf lines -->
        <line x1="105" y1="110" x2="105" y2="158" stroke="#22C55E" stroke-width="1" opacity="0.4"/>
        <line x1="125" y1="110" x2="125" y2="158" stroke="#22C55E" stroke-width="1" opacity="0.4"/>
        <line x1="145" y1="110" x2="145" y2="158" stroke="#22C55E" stroke-width="1" opacity="0.4"/>
        <line x1="165" y1="110" x2="165" y2="158" stroke="#22C55E" stroke-width="1" opacity="0.4"/>
        <line x1="185" y1="110" x2="185" y2="158" stroke="#22C55E" stroke-width="1" opacity="0.4"/>
        <!-- Grill char marks -->
        <path d="M110 120 Q122 135 112 148" stroke="#18181B" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
        <path d="M140 115 Q152 135 142 152" stroke="#18181B" stroke-width="5" stroke-linecap="round" opacity="0.7"/>
        <path d="M170 122 Q180 138 174 146" stroke="#18181B" stroke-width="4" stroke-linecap="round" opacity="0.65"/>
        <!-- Toothpicks pinning the ends -->
        <line x1="94" y1="104" x2="94" y2="164" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
        <line x1="206" y1="104" x2="206" y2="164" stroke="#FDE047" stroke-width="3" stroke-linecap="round"/>
        <!-- Steam curls -->
        <path d="M130 95 Q125 80 135 70" stroke="#16A34A" stroke-width="2" fill="none" opacity="0.6"/>
        <path d="M150 92 Q145 74 158 65" stroke="#16A34A" stroke-width="2.5" fill="none" opacity="0.7"/>
        <path d="M170 96 Q165 82 175 72" stroke="#16A34A" stroke-width="2" fill="none" opacity="0.6"/>
      </g>
      <rect x="18" y="18" width="90" height="20" rx="6" fill="#15803D" fill-opacity="0.16"/>
      <text x="63" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#166534" text-anchor="middle">NASI BAKAR KEMANGI</text>
    `);
  }

  // 8. Makanan Stok Terbatas: Risol Mayo Smoked Beef (Isi 2)
  if (cleanSku === 'LIM-002' || lowerName.includes('risol')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFBEB"/>
          <stop offset="100%" stop-color="#FEF3C7"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="184" rx="55" ry="12" fill="#B45309" fill-opacity="0.18"/>
      <!-- Whole Risol in back -->
      <rect x="95" y="125" width="80" height="34" rx="14" fill="#D97706" stroke="#92400E" stroke-width="2" transform="rotate(-12 135 142)"/>
      <!-- Cut Risol front with cross-section -->
      <g transform="translate(140, 105)">
        <path d="M0 25 L45 0 L65 30 L20 55 Z" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
        <!-- Inner cross section cut face -->
        <ellipse cx="10" cy="40" rx="16" ry="12" fill="#FEF08A" stroke="#B45309" stroke-width="1.5"/>
        <!-- Mayo filling -->
        <circle cx="10" cy="40" r="10" fill="#FFFFFF"/>
        <!-- Smoked beef slice -->
        <path d="M4 36 Q10 32 16 38" stroke="#BE123C" stroke-width="3" stroke-linecap="round"/>
        <!-- Boiled egg yolk -->
        <circle cx="9" cy="42" r="3.5" fill="#F59E0B"/>
      </g>
      <!-- Breadcrumb crumbs -->
      <circle cx="120" cy="168" r="1.5" fill="#D97706"/>
      <circle cx="135" cy="172" r="1.2" fill="#D97706"/>
      <circle cx="210" cy="166" r="1.6" fill="#D97706"/>
      <rect x="18" y="18" width="85" height="20" rx="6" fill="#D97706" fill-opacity="0.18"/>
      <text x="60" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#92400E" text-anchor="middle">RISOL MAYO BEEF</text>
    `);
  }

  // 9. Makanan Stok Terbatas: Salad Buah Cup Segar 200ml
  if (cleanSku === 'LIM-003' || lowerName.includes('salad')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FDF4FF"/>
          <stop offset="100%" stop-color="#FAE8FF"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="190" rx="46" ry="10" fill="#86198F" fill-opacity="0.14"/>
      <!-- Clear Cup -->
      <polygon points="128,95 192,95 182,180 138,180" fill="#FFFFFF" fill-opacity="0.5" stroke="#E879F9" stroke-width="1.5"/>
      <!-- Fruit chunks inside cup -->
      <!-- Melon green -->
      <rect x="142" y="145" width="14" height="14" rx="3" fill="#86EFAC"/>
      <!-- Watermelon red -->
      <rect x="160" y="150" width="14" height="14" rx="3" fill="#F43F5E"/>
      <!-- Grape purple -->
      <circle cx="152" cy="132" r="8" fill="#A855F7"/>
      <!-- Mango orange -->
      <rect x="164" y="128" width="12" height="12" rx="3" fill="#FBBF24"/>
      <!-- Cream / Yogurt layer top -->
      <path d="M124 95 Q160 86 196 95 L192 112 Q160 120 128 112 Z" fill="#FFFFFF" stroke="#F0ABFC" stroke-width="1"/>
      <!-- Shredded cheese on top -->
      <line x1="140" y1="92" x2="154" y2="88" stroke="#FDE047" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="160" y1="94" x2="175" y2="90" stroke="#FDE047" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="148" y1="96" x2="162" y2="92" stroke="#FACC15" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Cherry on top -->
      <circle cx="160" cy="78" r="8" fill="#E11D48"/>
      <path d="M162 72 Q174 54 180 58" stroke="#15803D" stroke-width="2" fill="none"/>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#C026D3" fill-opacity="0.14"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#86198F" text-anchor="middle">SALAD BUAH SEGAR</text>
    `);
  }

  // 10. Jasa Print: Hitam Putih
  if (cleanSku === 'PRT-BW1' || (lowerName.includes('print') && lowerName.includes('hitam'))) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#F1F5F9"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="188" rx="55" ry="10" fill="#334155" fill-opacity="0.14"/>
      <!-- Back paper -->
      <rect x="135" y="45" width="75" height="110" rx="4" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1" transform="rotate(-6 172 100)"/>
      <!-- Front Document -->
      <g transform="translate(118, 52)">
        <rect width="84" height="122" rx="4" fill="#FFFFFF" stroke="#64748B" stroke-width="1.5"/>
        <!-- Folded corner top-right -->
        <polygon points="68,0 84,16 68,16" fill="#CBD5E1"/>
        <line x1="68" y1="0" x2="84" y2="16" stroke="#64748B" stroke-width="1.2"/>
        <!-- Header line -->
        <rect x="10" y="14" width="45" height="5" rx="1" fill="#0F172A"/>
        <rect x="10" y="24" width="64" height="2" fill="#64748B"/>
        <!-- Text lines -->
        <line x1="10" y1="35" x2="74" y2="35" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        <line x1="10" y1="43" x2="70" y2="43" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        <line x1="10" y1="51" x2="74" y2="51" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        <line x1="10" y1="59" x2="56" y2="59" stroke="#334155" stroke-width="2" stroke-linecap="round"/>
        <line x1="10" y1="71" x2="74" y2="71" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 2"/>
        <line x1="10" y1="78" x2="74" y2="78" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 2"/>
        <line x1="10" y1="85" x2="60" y2="85" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 2"/>
        <!-- Stamp circle -->
        <circle cx="62" cy="102" r="12" fill="none" stroke="#0F172A" stroke-width="1.5" stroke-dasharray="3 1.5"/>
        <text x="62" y="105" font-family="sans-serif" font-size="5" font-weight="900" fill="#0F172A" text-anchor="middle">PRINT B/W</text>
      </g>
      <rect x="18" y="18" width="85" height="20" rx="6" fill="#334155" fill-opacity="0.12"/>
      <text x="60" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#1E293B" text-anchor="middle">PRINT HITAM PUTIH</text>
    `);
  }

  // 11. Jasa Print: Berwarna
  if (cleanSku === 'PRT-CL1' || (lowerName.includes('print') && lowerName.includes('warna'))) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#EFF6FF"/>
          <stop offset="100%" stop-color="#DBEAFE"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="188" rx="55" ry="10" fill="#1D4ED8" fill-opacity="0.15"/>
      <g transform="translate(118, 52)">
        <rect width="84" height="122" rx="4" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.5"/>
        <!-- Color Header banner -->
        <rect x="8" y="12" width="68" height="10" rx="2" fill="#2563EB"/>
        <text x="42" y="19.5" font-family="sans-serif" font-size="6" font-weight="900" fill="#FFFFFF" text-anchor="middle">LAPORAN BERWARNA</text>
        <!-- Color Pie Chart -->
        <circle cx="28" cy="46" r="14" fill="#10B981"/>
        <path d="M28 46 L28 32 A14 14 0 0 1 42 46 Z" fill="#F59E0B"/>
        <path d="M28 46 L42 46 A14 14 0 0 1 32 59 Z" fill="#EF4444"/>
        <!-- Color Bar Chart -->
        <rect x="48" y="50" width="6" height="10" fill="#3B82F6"/>
        <rect x="56" y="44" width="6" height="16" fill="#10B981"/>
        <rect x="64" y="38" width="6" height="22" fill="#F59E0B"/>
        <!-- Text lines -->
        <line x1="10" y1="72" x2="74" y2="72" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
        <line x1="10" y1="80" x2="74" y2="80" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
        <line x1="10" y1="88" x2="55" y2="88" stroke="#64748B" stroke-width="2" stroke-linecap="round"/>
        <!-- CMYK dots indicator -->
        <circle cx="18" cy="106" r="3" fill="#06B6D4"/>
        <circle cx="26" cy="106" r="3" fill="#EC4899"/>
        <circle cx="34" cy="106" r="3" fill="#EAB308"/>
        <circle cx="42" cy="106" r="3" fill="#0F172A"/>
      </g>
      <rect x="18" y="18" width="85" height="20" rx="6" fill="#2563EB" fill-opacity="0.14"/>
      <text x="60" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#1D4ED8" text-anchor="middle">PRINT BERWARNA</text>
    `);
  }

  // 12. Jasa Print: Full Color / Foto
  if (cleanSku === 'PRT-FCL' || lowerName.includes('foto')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F5F3FF"/>
          <stop offset="100%" stop-color="#EDE9FE"/>
        </linearGradient>
        <linearGradient id="photo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="50%" stop-color="#818CF8"/>
          <stop offset="100%" stop-color="#EC4899"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="188" rx="55" ry="10" fill="#4F46E5" fill-opacity="0.16"/>
      <!-- Photo frame paper -->
      <g transform="translate(115, 50)">
        <rect width="90" height="124" rx="4" fill="#FFFFFF" stroke="#6366F1" stroke-width="2"/>
        <!-- Inner Photo rectangle -->
        <rect x="8" y="8" width="74" height="82" rx="2" fill="url(#photo)"/>
        <!-- Mountain landscape artwork -->
        <polygon points="12,74 38,44 58,74" fill="#312E81" opacity="0.6"/>
        <polygon points="40,74 62,38 80,74" fill="#1E1B4B" opacity="0.8"/>
        <circle cx="68" cy="26" r="6" fill="#FDE047"/>
        <!-- Glossy sheen reflection -->
        <polygon points="8,8 45,8 8,45" fill="#FFFFFF" fill-opacity="0.35"/>
        <text x="45" y="106" font-family="sans-serif" font-size="7" font-weight="900" fill="#4338CA" text-anchor="middle">GLOSSY PHOTO PRINT</text>
      </g>
      <rect x="18" y="18" width="85" height="20" rx="6" fill="#6366F1" fill-opacity="0.16"/>
      <text x="60" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#4338CA" text-anchor="middle">PRINT KERTAS FOTO</text>
    `);
  }

  // 13. ATK: Buku Tulis Koperasi 58 Lembar
  if (cleanSku === 'ATK-001' || lowerName.includes('buku')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="188" rx="55" ry="11" fill="#1E293B" fill-opacity="0.16"/>
      <!-- Notebook -->
      <g transform="translate(116, 52)">
        <rect width="88" height="122" rx="6" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
        <!-- Binding tape left side -->
        <rect x="0" y="0" width="16" height="122" rx="3" fill="#0F172A"/>
        <!-- Lined pattern background -->
        <line x1="24" y1="20" x2="80" y2="20" stroke="#BAE6FD" stroke-width="1"/>
        <line x1="24" y1="35" x2="80" y2="35" stroke="#BAE6FD" stroke-width="1"/>
        <!-- Center label box -->
        <rect x="24" y="44" width="56" height="42" rx="4" fill="#FFFFFF" stroke="#0369A1" stroke-width="1.2"/>
        <text x="52" y="56" font-family="sans-serif" font-size="6" font-weight="900" fill="#0369A1" text-anchor="middle">BUKU TULIS</text>
        <line x1="30" y1="64" x2="74" y2="64" stroke="#94A3B8" stroke-width="1"/>
        <line x1="30" y1="72" x2="74" y2="72" stroke="#94A3B8" stroke-width="1"/>
        <line x1="30" y1="80" x2="74" y2="80" stroke="#94A3B8" stroke-width="1"/>
        <!-- 58 Sheets badge -->
        <rect x="42" y="96" width="38" height="14" rx="4" fill="#F59E0B"/>
        <text x="61" y="106" font-family="sans-serif" font-size="7" font-weight="900" fill="#FFFFFF" text-anchor="middle">58 LBR</text>
      </g>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#0284C7" fill-opacity="0.15"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#0369A1" text-anchor="middle">BUKU TULIS ATK</text>
    `);
  }

  // 14. ATK: Pulpen Gel Hitam 0.5mm
  if (cleanSku === 'ATK-002' || lowerName.includes('pulpen')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F1F5F9"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
        <linearGradient id="penBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#18181B"/>
          <stop offset="40%" stop-color="#3F3F46"/>
          <stop offset="100%" stop-color="#09090B"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="186" rx="55" ry="8" fill="#18181B" fill-opacity="0.15"/>
      <!-- Smooth ink trail on paper -->
      <path d="M120 185 Q160 178 185 186 Q200 190 220 184" stroke="#09090B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <g transform="translate(45, 10) rotate(-35 160 120)">
        <!-- Pen Tip metal needle -->
        <polygon points="156,20 164,20 161,6 159,6" fill="#A1A1AA" stroke="#71717A" stroke-width="0.5"/>
        <polygon points="159,6 161,6 160.5,1 159.5,1" fill="#09090B"/>
        <!-- Clear grip / rubber -->
        <rect x="154" y="20" width="12" height="30" rx="2" fill="#52525B" stroke="#27272A" stroke-width="1"/>
        <line x1="154" y1="28" x2="166" y2="28" stroke="#3F3F46" stroke-width="1"/>
        <line x1="154" y1="36" x2="166" y2="36" stroke="#3F3F46" stroke-width="1"/>
        <!-- Main Pen Barrel -->
        <rect x="154" y="50" width="12" height="110" rx="3" fill="url(#penBody)"/>
        <!-- Ink window showing black ink inside -->
        <rect x="157" y="60" width="6" height="50" rx="2" fill="#09090B" stroke="#71717A" stroke-width="0.8"/>
        <!-- Clip & Cap top -->
        <rect x="152" y="152" width="16" height="16" rx="2" fill="#27272A"/>
        <rect x="166" y="115" width="4" height="48" rx="2" fill="#D4D4D8"/>
      </g>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#18181B" fill-opacity="0.14"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#18181B" text-anchor="middle">PULPEN GEL 0.5</text>
    `);
  }

  // 15. ATK: Busur Derajat & Jangka Besi Set
  if (cleanSku === 'ATK-003' || lowerName.includes('jangka') || lowerName.includes('busur')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="186" rx="55" ry="10" fill="#334155" fill-opacity="0.15"/>
      <!-- Protractor (Busur Derajat) -->
      <g transform="translate(100, 75)">
        <path d="M10 80 A55 55 0 0 1 120 80 Z" fill="#E0F2FE" fill-opacity="0.75" stroke="#0284C7" stroke-width="1.8"/>
        <path d="M35 80 A30 30 0 0 1 95 80 Z" fill="#F8FAFC" stroke="#0284C7" stroke-width="1.2"/>
        <circle cx="65" cy="80" r="3" fill="#0284C7"/>
        <!-- Degree tick marks -->
        <line x1="65" y1="26" x2="65" y2="34" stroke="#0369A1" stroke-width="1.5"/>
        <line x1="28" y1="44" x2="34" y2="49" stroke="#0369A1" stroke-width="1.5"/>
        <line x1="102" y1="44" x2="96" y2="49" stroke="#0369A1" stroke-width="1.5"/>
        <text x="65" y="44" font-family="sans-serif" font-size="6" font-weight="900" fill="#0369A1" text-anchor="middle">90°</text>
      </g>
      <!-- Steel Compass (Jangka Besi) -->
      <g transform="translate(145, 45) rotate(18)">
        <!-- Compass Hinge Knob -->
        <circle cx="20" cy="15" r="7" fill="#64748B"/>
        <circle cx="20" cy="15" r="4" fill="#94A3B8"/>
        <!-- Compass Legs -->
        <line x1="18" y1="20" x2="6" y2="110" stroke="#475569" stroke-width="4.5" stroke-linecap="round"/>
        <line x1="22" y1="20" x2="38" y2="108" stroke="#475569" stroke-width="4.5" stroke-linecap="round"/>
        <!-- Needle Point left -->
        <polygon points="5,110 7,110 6,124" fill="#0F172A"/>
        <!-- Pencil attachment right -->
        <rect x="34" y="85" width="8" height="24" rx="2" fill="#EAB308" stroke="#CA8A04" stroke-width="1"/>
        <polygon points="34,109 42,109 38,122" fill="#A16207"/>
        <polygon points="37,120 39,120 38,124" fill="#0F172A"/>
      </g>
      <rect x="18" y="18" width="85" height="20" rx="6" fill="#475569" fill-opacity="0.14"/>
      <text x="60" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#334155" text-anchor="middle">SET JANGKA BUSUR</text>
    `);
  }

  // 16. Atribut Seragam: Dasi Sekolah Bordir Logo (SMA/SMK)
  if (cleanSku === 'SRG-001' || lowerName.includes('dasi')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
        <linearGradient id="tie" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1E3A8A"/>
          <stop offset="50%" stop-color="#1E40AF"/>
          <stop offset="100%" stop-color="#172554"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="192" rx="42" ry="10" fill="#1E3A8A" fill-opacity="0.18"/>
      <!-- Necktie -->
      <g>
        <!-- Knot -->
        <polygon points="148,46 172,46 166,66 154,66" fill="#172554" stroke="#1E3A8A" stroke-width="1"/>
        <!-- Tie Blade Body -->
        <polygon points="154,66 166,66 174,165 160,188 146,165" fill="url(#tie)" stroke="#1E3A8A" stroke-width="1"/>
        <!-- Fine fabric stripes -->
        <line x1="152" y1="85" x2="168" y2="85" stroke="#3B82F6" stroke-width="1.5" opacity="0.6"/>
        <line x1="150" y1="102" x2="170" y2="102" stroke="#3B82F6" stroke-width="1.5" opacity="0.6"/>
        <!-- Embroidered School Emblem Badge -->
        <g transform="translate(150, 115)">
          <polygon points="10,0 20,8 16,22 10,26 4,22 0,8" fill="#FBBF24" stroke="#B45309" stroke-width="1"/>
          <circle cx="10" cy="12" r="5" fill="#1E3A8A"/>
          <text x="10" y="15" font-family="sans-serif" font-size="5" font-weight="900" fill="#FFFFFF" text-anchor="middle">SMA</text>
        </g>
      </g>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#1E40AF" fill-opacity="0.15"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#1E40AF" text-anchor="middle">DASI SERAGAM</text>
    `);
  }

  // 17. Atribut Seragam: Topi Upacara Bordir Putih Abu
  if (cleanSku === 'SRG-002' || lowerName.includes('topi')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F1F5F9"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="186" rx="65" ry="14" fill="#334155" fill-opacity="0.18"/>
      <!-- Monday Ceremony School Cap -->
      <g transform="translate(90, 60)">
        <!-- Cap Crown (Putih bagian depan/atas) -->
        <path d="M30 68 C30 25 110 25 110 68 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
        <!-- Side crown panels (Abu-abu SMA) -->
        <path d="M30 68 C30 35 60 30 70 68 Z" fill="#64748B" opacity="0.9"/>
        <path d="M110 68 C110 35 80 30 70 68 Z" fill="#475569" opacity="0.9"/>
        <!-- Center Button on top -->
        <circle cx="70" cy="30" r="5" fill="#334155"/>
        <!-- Stiff Visor Brim front (Lidah topi abu-abu) -->
        <path d="M22 68 C35 94 105 94 118 68 C95 82 45 82 22 68 Z" fill="#334155" stroke="#1E293B" stroke-width="1.5"/>
        <!-- Embroidered OSIS School Crest on front -->
        <polygon points="70,42 78,48 76,58 70,62 64,58 62,48" fill="#F59E0B" stroke="#B45309" stroke-width="0.8"/>
        <circle cx="70" cy="51" r="3.5" fill="#78350F"/>
        <text x="70" y="53" font-family="sans-serif" font-size="3.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">OSIS</text>
      </g>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#475569" fill-opacity="0.14"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#1E293B" text-anchor="middle">TOPI UPACARA</text>
    `);
  }

  // 18. Atribut Seragam: Kaos Kaki Logo Sekolah Putih Hitam
  if (cleanSku === 'SRG-003' || lowerName.includes('kaos kaki')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#F1F5F9"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="188" rx="55" ry="11" fill="#1E293B" fill-opacity="0.16"/>
      <!-- Left Sock -->
      <g transform="translate(110, 50)">
        <!-- White Upper Leg -->
        <path d="M20 18 L44 18 L44 95 Q44 125 78 125 L88 125 Q96 125 96 115 Q96 105 82 105 L48 90 L48 18 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="2"/>
        <!-- Reinforced Black Sole (Telapak hitam anti kotor) -->
        <path d="M40 92 Q42 126 78 126 L88 126 Q98 126 98 116 L92 110 Q78 118 46 88 Z" fill="#1E293B"/>
        <!-- Ribbed Top Cuff with Green/Black stripe -->
        <rect x="20" y="18" width="28" height="6" fill="#166534"/>
        <rect x="20" y="26" width="28" height="2" fill="#1E293B"/>
        <!-- School initials embroidered -->
        <text x="34" y="44" font-family="sans-serif" font-size="7" font-weight="900" fill="#15803D" text-anchor="middle">SMK</text>
      </g>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#166534" fill-opacity="0.14"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#14532D" text-anchor="middle">KAOS KAKI RESMI</text>
    `);
  }

  // 19. Atribut Seragam: Sabuk Ikat Pinggang Gesper Sekolah
  if (cleanSku === 'SRG-004' || lowerName.includes('sabuk') || lowerName.includes('gesper')) {
    return createSvgUri(`
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F8FAFC"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="40%" stop-color="#EAB308"/>
          <stop offset="70%" stop-color="#CA8A04"/>
          <stop offset="100%" stop-color="#A16207"/>
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#bg)"/>
      <ellipse cx="160" cy="186" rx="55" ry="11" fill="#1E293B" fill-opacity="0.18"/>
      <!-- Coiled Black Leather Belt -->
      <g transform="translate(10, 5)">
        <path d="M75 140 C75 105 130 95 180 100 C210 105 230 125 230 145 C230 165 200 178 150 176" stroke="#18181B" stroke-width="26" fill="none" stroke-linecap="round"/>
        <!-- Stitching along belt edges -->
        <path d="M75 130 C75 100 130 90 180 94" stroke="#52525B" stroke-width="1.2" stroke-dasharray="3 2" fill="none"/>
        <path d="M75 150 C75 110 130 102 180 106" stroke="#52525B" stroke-width="1.2" stroke-dasharray="3 2" fill="none"/>
        <!-- Belt Eyelet holes -->
        <circle cx="205" cy="120" r="2.5" fill="#D4D4D8" stroke="#18181B" stroke-width="1"/>
        <circle cx="218" cy="132" r="2.5" fill="#D4D4D8" stroke="#18181B" stroke-width="1"/>
        <circle cx="222" cy="148" r="2.5" fill="#D4D4D8" stroke="#18181B" stroke-width="1"/>
        <!-- Polished Brass Buckle (Kepala Kuningan) -->
        <rect x="110" y="112" width="56" height="46" rx="6" fill="url(#gold)" stroke="#78350F" stroke-width="2"/>
        <rect x="118" y="120" width="40" height="30" rx="3" fill="#CA8A04" stroke="#FEF08A" stroke-width="1"/>
        <!-- Embossed School Logo in center of buckle -->
        <circle cx="138" cy="135" r="9" fill="#854D0E"/>
        <text x="138" y="138" font-family="sans-serif" font-size="7" font-weight="900" fill="#FEF08A" text-anchor="middle">SMP</text>
      </g>
      <rect x="18" y="18" width="80" height="20" rx="6" fill="#A16207" fill-opacity="0.16"/>
      <text x="58" y="32" font-family="sans-serif" font-size="10" font-weight="800" fill="#78350F" text-anchor="middle">SABUK SEKOLAH</text>
    `);
  }

  // Generic fallback if unknown product
  return createFallbackArtwork(name || sku, category);
}

function createFallbackArtwork(title: string, category: string): string {
  const shortTitle = title.length > 20 ? `${title.slice(0, 18)}...` : title;
  return createSvgUri(`
    <rect width="320" height="240" fill="#F8FAFC"/>
    <rect x="20" y="20" width="280" height="200" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <circle cx="160" cy="100" r="36" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
    <path d="M148 92 L172 92 L172 108 L148 108 Z" fill="#94A3B8"/>
    <text x="160" y="160" font-family="sans-serif" font-size="13" font-weight="700" fill="#0F172A" text-anchor="middle">${shortTitle}</text>
    <text x="160" y="178" font-family="sans-serif" font-size="10" font-weight="600" fill="#64748B" text-anchor="middle">${category || 'Produk EcoMart'}</text>
  `);
}

function createSvgUri(content: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">${content}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function isOldGenericSvg(imageUrl?: string | null): boolean {
  if (!imageUrl) return true;
  if (!imageUrl.startsWith('data:image/svg+xml')) return false;
  return (
    imageUrl.includes('320%20220') ||
    imageUrl.includes('Koperasi%20Ecomart%20Sekolah') ||
    imageUrl.includes('font-size%3D%2218%22')
  );
}

export function migrateProductImageIfNeeded<T extends { sku: string; name: string; category: any; imageUrl?: string }>(product: T): T {
  if (!product.imageUrl || isOldGenericSvg(product.imageUrl)) {
    return {
      ...product,
      imageUrl: getProductArtwork(product.sku, product.name, product.category),
    };
  }
  return product;
}

