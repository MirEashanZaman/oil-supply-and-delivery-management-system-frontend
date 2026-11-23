"use client";

import React from "react";

interface PostProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  newProduct: {
    name: string;
    description: string;
    price: string;
    stock: string;
    category: string;
    photo: File | null;
  };
  setNewProduct: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      price: string;
      stock: string;
      category: string;
      photo: File | null;
    }>
  >;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
}

export const PostProductModal: React.FC<PostProductModalProps> = ({
  isOpen,
  onClose,
  newProduct,
  setNewProduct,
  onSubmit,
  submitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] w-full max-w-[540px] rounded-2xl p-6 relative text-left">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-5">
          <div>
            <h3 className="text-lg font-medium text-[#111827]">
              Post New Product Lot
            </h3>
            <p className="text-xs text-[#6B7487] mt-0.5">
              Publish a certified petroleum grade to the supply catalog
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F7FA] text-[#4B5565] transition-colors hover:bg-[#ECEFF4] hover:text-[#111827] cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Product name
            </label>
            <input
              type="text"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#6B7487] focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
              placeholder="e.g. Ultra-Low Sulfur Diesel"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Category
            </label>
            <select
              value={newProduct.category}
              onChange={(e) =>
                setNewProduct((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#111827] focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
            >
              <option value="Octane">Octane</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="Kerosene">Kerosene</option>
              <option value="LPG">LPG / Gas</option>
              <option value="Lubricant">Engine Lubricant</option>
              <option value="Industrial">Industrial Fuel</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1">
                Unit price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, price: e.target.value }))
                }
                className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#111827] placeholder:text-[#6B7487] focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
                placeholder="85.00"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#111827] mb-1">
                Stock (units)
              </label>
              <input
                type="number"
                min="0"
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct((prev) => ({ ...prev, stock: e.target.value }))
                }
                className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#111827] placeholder:text-[#6B7487] focus:outline-none focus:bg-white focus:border-[#0F2747] transition-colors"
                placeholder="1500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#111827] mb-1">
              Specification notes
            </label>
            <textarea
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full bg-[#F5F7FA] border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#6B7487] focus:outline-none focus:bg-white focus:border-[#0F2747] resize-none h-20 transition-colors"
              placeholder="Grade specification and sulfur rating"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#111827]">
              Product photo
            </label>
            <p className="text-xs text-[#6B7487]">
              Upload a photo for this petroleum grade
            </p>

            {newProduct.photo ? (
              <div className="flex items-center gap-3 p-3 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-[#E2E8F0] shrink-0 relative">
                  <img
                    src={URL.createObjectURL(newProduct.photo)}
                    alt="Product preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111827] truncate">
                    {newProduct.photo.name}
                  </p>
                  <p className="text-xs text-[#6B7487] font-mono tabular-nums">
                    {(newProduct.photo.size / 1024).toFixed(1)} KB
                  </p>
                  <label
                    htmlFor="product-photo-upload"
                    className="inline-block mt-1 text-xs font-medium text-[#0F2747] hover:underline cursor-pointer"
                  >
                    Change photo
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNewProduct((prev) => ({ ...prev, photo: null }))
                  }
                  className="px-2.5 py-1 text-xs font-medium text-[#DC2626] hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border border-dashed border-[#CBD5E1] hover:border-[#0F2747] rounded-xl p-4 bg-[#F5F7FA] transition-colors cursor-pointer relative group">
                <label
                  htmlFor="product-photo-upload"
                  className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
                >
                  <svg
                    className="w-6 h-6 text-[#6B7487] group-hover:text-[#0F2747] transition-colors mb-1.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-[#111827]">
                    Select product photo
                  </span>
                  <span className="text-xs text-[#6B7487] mt-0.5">
                    PNG, JPG, WEBP
                  </span>
                </label>
              </div>
            )}

            <input
              id="product-photo-upload"
              type="file"
              accept="image/*"
              required={!newProduct.photo}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setNewProduct((prev) => ({
                  ...prev,
                  photo: file,
                }));
              }}
              className="hidden"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#111827] hover:bg-[#F5F7FA] rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#0F2747] hover:bg-[#163860] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Publishing..." : "Publish Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
