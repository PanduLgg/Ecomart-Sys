import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Clock, Calendar, PieChart } from 'lucide-react';
import type { DailyClosingRecord, TransactionRecord } from '../types.ts';
import { PRODUCT_CATEGORIES, formatRupiah } from '../utils/billingLogic.ts';

interface AdminSalesChartProps {
  transactions: TransactionRecord[];
  closingHistory: DailyClosingRecord[];
  businessDate: string;
}

type ChartViewMode = 'hourly' | 'daily' | 'category';

interface ChartBarData {
  key: string;
  label: string;
  subLabel?: string;
  revenue: number;
  transactionsCount: number;
  cashRevenue: number;
  qrisRevenue: number;
}

export const AdminSalesChart: React.FC<AdminSalesChartProps> = ({
  transactions,
  closingHistory,
  businessDate,
}) => {
  const [viewMode, setViewMode] = useState<ChartViewMode>('hourly');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter today's transactions
  const todayTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.businessDate === businessDate);
  }, [transactions, businessDate]);

  // Compute Hourly Data (07:00 - 16:00)
  const hourlyData = useMemo<ChartBarData[]>(() => {
    const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    return hours.map((hour) => {
      const label = `${String(hour).padStart(2, '0')}:00`;
      const txsInHour = todayTransactions.filter((tx) => {
        try {
          const d = new Date(tx.createdAt);
          return d.getHours() === hour;
        } catch {
          return false;
        }
      });

      const revenue = txsInHour.reduce((sum, t) => sum + t.totalAmount, 0);
      const cashRevenue = txsInHour
        .filter((t) => t.paymentMethod === 'Tunai')
        .reduce((sum, t) => sum + t.totalAmount, 0);
      const qrisRevenue = txsInHour
        .filter((t) => t.paymentMethod === 'QRIS Koperasi')
        .reduce((sum, t) => sum + t.totalAmount, 0);

      let subLabel = '';
      if (hour === 9 || hour === 10) subLabel = 'Istirahat 1';
      else if (hour === 12 || hour === 13) subLabel = 'Istirahat 2';

      return {
        key: `hour-${hour}`,
        label,
        subLabel,
        revenue,
        transactionsCount: txsInHour.length,
        cashRevenue,
        qrisRevenue,
      };
    });
  }, [todayTransactions]);

  // Compute Daily Trend Data (Last 7 Days)
  const dailyData = useMemo<ChartBarData[]>(() => {
    const recordsMap = new Map<string, { rev: number; count: number; cash: number; qris: number }>();

    // From closing history
    closingHistory.forEach((rec) => {
      recordsMap.set(rec.businessDate, {
        rev: rec.totalRevenue,
        count: rec.totalTransactions,
        cash: rec.insideAreaRevenue,
        qris: rec.outsideAreaRevenue,
      });
    });

    // Today's live
    const todayTotal = todayTransactions.reduce((s, t) => s + t.totalAmount, 0);
    const todayCash = todayTransactions.filter((t) => t.paymentMethod === 'Tunai').reduce((s, t) => s + t.totalAmount, 0);
    const todayQris = todayTransactions.filter((t) => t.paymentMethod === 'QRIS Koperasi').reduce((s, t) => s + t.totalAmount, 0);
    recordsMap.set(businessDate, {
      rev: todayTotal,
      count: todayTransactions.length,
      cash: todayCash,
      qris: todayQris,
    });

    const dates = Array.from(recordsMap.keys()).sort();
    const last7Dates = dates.slice(-7);

    return last7Dates.map((dateStr) => {
      const data = recordsMap.get(dateStr) || { rev: 0, count: 0, cash: 0, qris: 0 };
      let shortLabel = dateStr;
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          shortLabel = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        }
      } catch {
        // fallback
      }

      return {
        key: `day-${dateStr}`,
        label: shortLabel,
        subLabel: dateStr === businessDate ? 'Hari Ini' : undefined,
        revenue: data.rev,
        transactionsCount: data.count,
        cashRevenue: data.cash,
        qrisRevenue: data.qris,
      };
    });
  }, [closingHistory, todayTransactions, businessDate]);

  // Compute Category Data
  const categoryData = useMemo<ChartBarData[]>(() => {
    return PRODUCT_CATEGORIES.map((cat) => {
      let revenue = 0;
      let units = 0;
      let cash = 0;
      let qris = 0;

      todayTransactions.forEach((tx) => {
        tx.items.forEach((item) => {
          if (item.category === cat) {
            const itemTotal = item.price * item.quantity;
            revenue += itemTotal;
            units += item.quantity;
            if (tx.paymentMethod === 'Tunai') cash += itemTotal;
            else qris += itemTotal;
          }
        });
      });

      // Shorten label for chart axis
      const shortLabel = cat === 'Makanan Stok Terbatas' ? 'Stok Terbatas' : cat;

      return {
        key: `cat-${cat}`,
        label: shortLabel,
        revenue,
        transactionsCount: units,
        cashRevenue: cash,
        qrisRevenue: qris,
      };
    });
  }, [todayTransactions]);

  const activeData = useMemo(() => {
    if (viewMode === 'hourly') return hourlyData;
    if (viewMode === 'daily') return dailyData;
    return categoryData;
  }, [viewMode, hourlyData, dailyData, categoryData]);

  // Overall KPIs for the active chart mode
  const totalRevenue = useMemo(() => {
    return activeData.reduce((s, d) => s + d.revenue, 0);
  }, [activeData]);

  const totalTransactions = useMemo(() => {
    return activeData.reduce((s, d) => s + d.transactionsCount, 0);
  }, [activeData]);

  const peakItem = useMemo(() => {
    if (activeData.length === 0) return null;
    return [...activeData].sort((a, b) => b.revenue - a.revenue)[0];
  }, [activeData]);

  const totalCash = useMemo(() => activeData.reduce((s, d) => s + d.cashRevenue, 0), [activeData]);
  const totalQris = useMemo(() => activeData.reduce((s, d) => s + d.qrisRevenue, 0), [activeData]);
  const cashPct = totalRevenue > 0 ? Math.round((totalCash / totalRevenue) * 100) : 0;
  const qrisPct = totalRevenue > 0 ? Math.round((totalQris / totalRevenue) * 100) : 0;

  // SVG Chart Geometry
  const svgWidth = 640;
  const svgHeight = 200;
  const margin = { top: 25, right: 15, bottom: 35, left: 65 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...activeData.map((d) => d.revenue), 10000);
    // Round up to nice number
    if (maxVal <= 50000) return 50000;
    if (maxVal <= 100000) return 100000;
    if (maxVal <= 250000) return 250000;
    if (maxVal <= 500000) return 500000;
    return Math.ceil(maxVal / 100000) * 100000;
  }, [activeData]);

  const yTicks = [
    { value: maxRevenue, label: maxRevenue >= 1000 ? `${maxRevenue / 1000}rb` : `${maxRevenue}` },
    { value: maxRevenue * 0.75, label: `${Math.round((maxRevenue * 0.75) / 1000)}rb` },
    { value: maxRevenue * 0.5, label: `${Math.round((maxRevenue * 0.5) / 1000)}rb` },
    { value: maxRevenue * 0.25, label: `${Math.round((maxRevenue * 0.25) / 1000)}rb` },
    { value: 0, label: '0' },
  ];

  const barCount = activeData.length;
  const barSlotWidth = chartWidth / (barCount || 1);
  const barWidth = Math.min(Math.max(barSlotWidth * 0.6, 14), 42);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
      {/* Chart Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-neutral-900">
              Grafik Penjualan & Pergerakan Omzet
            </h2>
            <p className="text-[11px] text-neutral-500">
              Visualisasi distribusi pendapatan toko, jam sibuk, dan metode pembayaran.
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex rounded-lg border border-neutral-300 bg-neutral-50 p-0.5 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('hourly')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'hourly'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Hari Ini (per Jam)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('daily')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'daily'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Tren 7 Hari</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('category')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'category'
                ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieChart className="h-3 w-3" />
            <span>Kategori</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row for Quick Context */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 sm:p-3">
          <span className="text-neutral-500 text-[11px] block">Total Omzet Periode</span>
          <span className="font-mono font-bold text-sm sm:text-base text-neutral-900 mt-0.5 block">
            {formatRupiah(totalRevenue)}
          </span>
          <span className="text-[10px] text-neutral-400">
            {viewMode === 'category' ? `${totalTransactions} unit terjual` : `${totalTransactions} struk tercatat`}
          </span>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 sm:p-3">
          <span className="text-neutral-500 text-[11px] block">
            {viewMode === 'hourly' ? 'Puncak Jam Ramai' : viewMode === 'daily' ? 'Omzet Tertinggi' : 'Kategori Terlaris'}
          </span>
          <span className="font-semibold text-xs sm:text-sm text-neutral-900 mt-0.5 block truncate">
            {peakItem && peakItem.revenue > 0 ? `${peakItem.label} ${peakItem.subLabel ? `(${peakItem.subLabel})` : ''}` : '-'}
          </span>
          <span className="text-[10px] font-mono text-emerald-700 font-semibold">
            {peakItem && peakItem.revenue > 0 ? formatRupiah(peakItem.revenue) : 'Belum ada data'}
          </span>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 sm:p-3">
          <span className="text-neutral-500 text-[11px] block">Metode Pembayaran Tunai</span>
          <span className="font-mono font-bold text-xs sm:text-sm text-neutral-900 mt-0.5 block">
            {formatRupiah(totalCash)}
          </span>
          <span className="text-[10px] text-neutral-500 font-medium">
            Porsi: <strong className="text-neutral-800">{cashPct}%</strong> dari omzet
          </span>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 sm:p-3">
          <span className="text-neutral-500 text-[11px] block">Pembayaran QRIS Koperasi</span>
          <span className="font-mono font-bold text-xs sm:text-sm text-emerald-800 mt-0.5 block">
            {formatRupiah(totalQris)}
          </span>
          <span className="text-[10px] text-neutral-500 font-medium">
            Porsi: <strong className="text-emerald-800">{qrisPct}%</strong> dari omzet
          </span>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-x-auto no-scrollbar border border-neutral-200 rounded-lg bg-neutral-50/30 p-2 sm:p-3">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 select-none"
          style={{ minWidth: '480px' }}
        >
          {/* Y-Axis Horizontal Gridlines & Labels */}
          {yTicks.map((tick, i) => {
            const y = margin.top + chartHeight - (tick.value / maxRevenue) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={svgWidth - margin.right}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray={i === yTicks.length - 1 ? 'none' : '3 3'}
                />
                <text
                  x={margin.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontFamily="monospace"
                  fontSize="10"
                  fill="#94A3B8"
                >
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Bar Columns */}
          {activeData.map((item, index) => {
            const slotX = margin.left + index * barSlotWidth;
            const barX = slotX + (barSlotWidth - barWidth) / 2;
            const barH = (item.revenue / maxRevenue) * chartHeight;
            const barY = margin.top + chartHeight - barH;
            const isHovered = hoveredIndex === index;
            const isPeak = peakItem?.key === item.key && item.revenue > 0;

            return (
              <g
                key={item.key}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover capture area */}
                <rect
                  x={slotX}
                  y={margin.top}
                  width={barSlotWidth}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Background slot subtle highlight on hover */}
                {isHovered && (
                  <rect
                    x={slotX + 2}
                    y={margin.top}
                    width={barSlotWidth - 4}
                    height={chartHeight}
                    fill="#F1F5F9"
                    rx="4"
                  />
                )}

                {/* Actual Data Bar */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={Math.max(barH, 3)}
                  rx="3"
                  fill={
                    isHovered
                      ? '#1E40AF'
                      : isPeak
                      ? '#15803D'
                      : '#0F172A'
                  }
                  className="transition-colors duration-150"
                />

                {/* Top Value on Peak or Hover */}
                {(isHovered || (isPeak && barWidth >= 20)) && item.revenue > 0 && (
                  <text
                    x={barX + barWidth / 2}
                    y={Math.max(barY - 5, margin.top - 8)}
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="9"
                    fontWeight="600"
                    fill={isHovered ? '#1E40AF' : '#15803D'}
                  >
                    {item.revenue >= 1000 ? `${Math.round(item.revenue / 1000)}k` : item.revenue}
                  </text>
                )}

                {/* X-Axis Label */}
                <text
                  x={slotX + barSlotWidth / 2}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                  fontSize="9.5"
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#0F172A' : '#64748B'}
                >
                  {item.label}
                </text>

                {/* SubLabel (e.g. Istirahat / Hari Ini) */}
                {item.subLabel && (
                  <text
                    x={slotX + barSlotWidth / 2}
                    y={svgHeight - 2}
                    textAnchor="middle"
                    fontFamily="sans-serif"
                    fontSize="8"
                    fontWeight="600"
                    fill="#94A3B8"
                  >
                    {item.subLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredIndex !== null && activeData[hoveredIndex] && (
          <div className="mt-2 flex items-center justify-between rounded-md bg-neutral-900 text-white px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-400">
                {activeData[hoveredIndex].label} {activeData[hoveredIndex].subLabel ? `(${activeData[hoveredIndex].subLabel})` : ''}
              </span>
              <span className="text-neutral-400">·</span>
              <span className="font-mono font-bold text-white">
                {formatRupiah(activeData[hoveredIndex].revenue)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-300 font-mono">
              <span>{activeData[hoveredIndex].transactionsCount} {viewMode === 'category' ? 'unit' : 'struk'}</span>
              <span>Tunai: {formatRupiah(activeData[hoveredIndex].cashRevenue)}</span>
              <span>QRIS: {formatRupiah(activeData[hoveredIndex].qrisRevenue)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
