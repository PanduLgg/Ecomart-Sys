import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, ShoppingCart } from 'lucide-react';
import type { Product } from '../types.ts';
import { formatRupiah } from '../utils/billingLogic.ts';

interface ProductDetailModalProps {
  product: Product | null;
  currentSimQty: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSimQty: (product: Product, newQty: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  currentSimQty,
  isOpen,
  onClose,
  onUpdateSimQty,
}) => {
  const [selectedQty, setSelectedQty] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedQty(currentSimQty > 0 ? currentSimQty : 1);
      setAddedToast(false);
    }
  }, [product, currentSimQty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isOutOfStock = product.stock <= 0;
  const maxAddable = Math.max(0, product.stock);

  const handleIncrement = () => {
    if (selectedQty < maxAddable) {
      setSelectedQty((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (selectedQty > 1) {
      setSelectedQty((prev) => prev - 1);
    }
  };

  const handleApplyToSim = () => {
    if (isOutOfStock) return;
    onUpdateSimQty(product, selectedQty);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
      onClose();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-name"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-4 top-4 rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content Layout */}
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Product Image */}
          <div className="w-full sm:w-44 aspect-square rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden shrink-0">
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Unboxed Metadata */}
              <div className="text-xs text-neutral-500 font-medium">
                <span>{product.category}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h2
                id="product-detail-name"
                className="mt-1 text-lg font-bold text-neutral-900 leading-snug"
              >
                {product.name}
              </h2>

              {/* Price */}
              <div className="mt-2 text-xl font-bold text-neutral-900 font-mono">
                {formatRupiah(product.price)}
                <span className="text-xs font-normal font-sans text-neutral-500 ml-1">
                  / {product.unit}
                </span>
              </div>

              {/* Stock Status */}
              <div className="mt-1.5 text-xs">
                {isOutOfStock ? (
                  <span className="font-semibold text-red-600">Stok Habis</span>
                ) : product.stock <= product.minStock ? (
                  <span className="font-semibold text-amber-700">
                    Sisa {product.stock} {product.unit} (Terbatas)
                  </span>
                ) : (
                  <span className="text-neutral-600">
                    Stok Tersedia: <strong className="text-neutral-900">{product.stock} {product.unit}</strong>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-3 text-xs leading-relaxed text-neutral-600">
                {product.description || 'Produk resmi EcoMart Store.'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Area */}
        <div className="mt-6 pt-4 border-t border-neutral-200">
          {!isOutOfStock ? (
            <div className="space-y-3">
              {/* Row 1: Quantity Stepper & Subtotal */}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-600">Jumlah:</span>
                  <div className="inline-flex items-center rounded-lg border border-neutral-300 bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={selectedQty <= 1}
                      aria-label="Kurangi jumlah"
                      className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-l-lg disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-mono text-sm font-bold tabular-nums text-neutral-900 px-3 min-w-[34px] text-center">
                      {selectedQty}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={selectedQty >= maxAddable}
                      aria-label="Tambah jumlah"
                      className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-r-lg disabled:opacity-30 transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-neutral-600 font-mono text-right">
                  <span className="text-neutral-500">Subtotal: </span>
                  <strong className="text-sm font-bold text-neutral-900 tabular-nums">
                    {formatRupiah(product.price * selectedQty)}
                  </strong>
                </div>
              </div>

              {/* Row 2: Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApplyToSim}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 active:bg-emerald-900 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  {addedToast ? (
                    <>
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Masuk Keranjang</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 shrink-0" />
                      <span>{currentSimQty > 0 ? 'Perbarui Keranjang' : '+ Masuk Keranjang'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Stok saat ini habis di EcoMart Store.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
