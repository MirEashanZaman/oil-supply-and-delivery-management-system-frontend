import React, { useState } from "react";
import { Product, UserData } from "../types";
import { getProductImage, getRolePath, getProductSourcingConfig, isProductOwner, isProductLinkedToUser } from "../utils";

interface ProductsTabProps {
  products: Product[];
  userData: UserData | null;
  loadingProducts: boolean;
  onAddToCart?: (product: Product) => void;
  onInstantOrder?: (product: Product) => void;
  onWholesaleOrder?: (product: Product) => void;
  onAddToPortfolio?: (product: Product) => void;
  onRemoveFromPortfolio?: (productId: number) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number, name: string) => void;
  onOpenPostProductModal?: () => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  userData,
  loadingProducts,
  onAddToCart,
  onInstantOrder,
  onWholesaleOrder,
  onAddToPortfolio,
  onRemoveFromPortfolio,
  onEditProduct,
  onDeleteProduct,
  onOpenPostProductModal,
}) => {
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedProductCategory, setSelectedProductCategory] = useState("All");

  const userRole = getRolePath(userData?.title || userData?.role);
  const isCustomer = userRole === "customer";
  const isAdmin = userRole === "admin";
  const isSupplier = userRole === "supplier";
  const isDealer = userRole === "dealer";
  const canPlaceOrder = isCustomer || isDealer;

  const portfolioKey = `user_portfolio_${userData?.id || userData?.email}`;
  const localPortfolio: number[] = typeof window !== "undefined"
    ? (() => {
      try {
        return JSON.parse(localStorage.getItem(portfolioKey) || "[]");
      } catch {
        return [];
      }
    })()
    : [];

  const productCategories = [
    "All",
    ...Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const query = productSearchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query)) ||
      (product.description && product.description.toLowerCase().includes(query));
    const matchesCategory =
      selectedProductCategory === "All" || product.category === selectedProductCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="w-full text-left animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E293B]">
            Petroleum Products & Fuels Marketplace
          </h1>
          <p className="text-sm text-[#64748B]">
            Certified petroleum grades sourced directly from national refineries and authorized regional depots.
          </p>
        </div>
        {(isSupplier || isDealer) && onOpenPostProductModal && (
          <button
            onClick={onOpenPostProductModal}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm border-none self-start sm:self-auto flex items-center gap-2"
          >
            <span>+</span> Post Product Lot
          </button>
        )}
      </div>

      <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              placeholder="Search petroleum fuels, octane grade, diesel..."
              className="w-full pl-10 pr-10 py-2.5 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] text-dark-slate placeholder-secondary-gray focus:outline-none focus:border-primary focus:bg-white transition-all shadow-inner"
            />
            {productSearchQuery && (
              <button
                type="button"
                onClick={() => setProductSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-dark-slate cursor-pointer"
                title="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
            <span className="font-semibold text-secondary-gray whitespace-nowrap">
              Showing <span className="font-bold text-dark-slate">{filteredProducts.length}</span> of <span className="font-bold text-dark-slate">{products.length}</span> products
            </span>
            {(productSearchQuery || selectedProductCategory !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setProductSearchQuery("");
                  setSelectedProductCategory("All");
                }}
                className="text-xs text-error-red hover:underline font-bold cursor-pointer whitespace-nowrap"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {productCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#F1F5F9]">
            <span className="text-xs font-bold text-secondary-gray mr-1">Filter by Category:</span>
            {productCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedProductCategory(cat)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${selectedProductCategory === cat
                  ? "bg-[#0F2747] text-white shadow-sm"
                  : "bg-[#F1F5F9] text-secondary-gray hover:bg-[#E2E8F0] hover:text-dark-slate"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingProducts ? (
        <div className="flex flex-col justify-center items-center py-16">
          <span className="loading loading-spinner loading-lg text-[#0F2747] mb-3"></span>
          <p className="text-sm text-secondary-gray">Loading live petroleum catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center shadow-sm max-w-xl mx-auto">
          <p className="text-secondary-gray font-medium mb-1">No products currently available in the catalog.</p>
          <p className="text-xs text-secondary-gray">New petroleum grades will appear here as soon as they are added.</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center shadow-sm max-w-xl mx-auto my-6">
          <h3 className="text-base font-bold text-dark-slate mb-1">No matching products found</h3>
          <p className="text-xs text-secondary-gray mb-4">
            No petroleum products match {productSearchQuery ? `"${productSearchQuery}"` : ""}{" "}
            {selectedProductCategory !== "All" ? `under category "${selectedProductCategory}"` : ""}.
          </p>
          <button
            type="button"
            onClick={() => {
              setProductSearchQuery("");
              setSelectedProductCategory("All");
            }}
            className="px-4 py-2 bg-[#0F2747] hover:bg-[#0F2747]/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            Reset Search & Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 justify-items-center w-full">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="card bg-white w-full sm:w-96 max-w-full border border-slate-200 overflow-hidden rounded-2xl"
            >
              <figure className="h-48 w-full overflow-hidden bg-[#F5F7FA]">
                <img
                  src={product.image || getProductImage(product.name, product.image, product.id)}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = getProductImage(product.name, undefined, product.id);
                  }}
                />
              </figure>
              <div className="card-body p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-secondary-gray bg-[#F1F5F9] px-2.5 py-1 rounded">
                      {product.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${product.stockLevel === "In Stock"
                        ? "bg-green-100 text-success-green"
                        : "bg-amber-100 text-[#D97706]"
                        }`}
                    >
                      {product.stockLevel}
                    </span>
                  </div>
                  {(() => {
                    const cfg = getProductSourcingConfig(product, [], []);
                    return (
                      <div className="mb-2">
                        {cfg.canChooseBetweenSupplierAndDealer ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            Buy from Supplier or Dealer
                          </span>
                        ) : cfg.posterRole === "supplier" ? (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            Refinery Direct Supplier
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            Dealer Exclusive
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <h2 className="card-title text-lg font-bold text-dark-slate mb-1">{product.name}</h2>
                  <p className="text-sm text-secondary-gray">{product.description || "No description provided."}</p>
                </div>

                <div className="pt-4 mt-2 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold text-[#0F2747]">{product.price}</span>
                  <div className="card-actions justify-end">
                    {(() => {
                      const isOwner = isProductOwner(product, userData);
                      const isLinkedToUser = !isOwner && isProductLinkedToUser(product, userData);

                      if (isAdmin) {
                        return (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onEditProduct && onEditProduct(product)}
                              className="btn btn-sm bg-[#0F2747] hover:bg-[#0F2747]/90 text-white font-bold border-none rounded-xl cursor-pointer"
                            >
                              Update (PUT)
                            </button>
                            <button
                              onClick={() => onDeleteProduct && onDeleteProduct(product.id, product.name)}
                              className="btn btn-sm bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-bold border-none rounded-xl cursor-pointer"
                            >
                              Delete (DELETE)
                            </button>
                          </div>
                        );
                      }

                      if (isDealer) {
                        if (isOwner) {
                          return (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-md">
                                My Posted Lot (Fixed in Profile)
                              </span>
                              <div className="flex gap-1.5">
                                {onEditProduct && (
                                  <button
                                    onClick={() => onEditProduct(product)}
                                    className="btn btn-xs bg-[#0F2747] hover:bg-[#0F2747]/90 text-white font-bold border-none rounded-lg cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}
                                {onDeleteProduct && (
                                  <button
                                    onClick={() => onDeleteProduct(product.id, product.name)}
                                    className="btn btn-xs bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-bold border-none rounded-lg cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (isLinkedToUser || localPortfolio.includes(product.id)) {
                          return (
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                onClick={() => onRemoveFromPortfolio && onRemoveFromPortfolio(product.id)}
                                className="btn btn-sm font-bold rounded-xl transition cursor-pointer bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-600 border border-emerald-300 hover:border-rose-300"
                                title="Remove from your profile. You cannot edit or delete profile-linked products."
                              >
                                ✓ In Profile • Remove
                              </button>
                              <button
                                onClick={() => onWholesaleOrder && onWholesaleOrder(product)}
                                className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm font-bold border-none rounded-xl cursor-pointer"
                              >
                                Bulk Source
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="flex flex-wrap justify-end gap-2">
                            {onAddToPortfolio && (
                              <button
                                onClick={() => onAddToPortfolio(product)}
                                className="btn bg-slate-100 hover:bg-slate-200 text-dark-slate btn-sm font-bold border border-slate-200 rounded-xl cursor-pointer"
                              >
                                + Add to Profile
                              </button>
                            )}
                            <button
                              onClick={() => onWholesaleOrder && onWholesaleOrder(product)}
                              className="btn bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] btn-sm font-bold border-none rounded-xl cursor-pointer"
                            >
                              Bulk Source
                            </button>
                          </div>
                        );
                      }

                      if (isSupplier) {
                        if (isOwner) {
                          return (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded-md">
                                My Supply Lot
                              </span>
                              <div className="flex gap-1.5">
                                {onEditProduct && (
                                  <button
                                    onClick={() => onEditProduct(product)}
                                    className="btn btn-xs bg-[#0F2747] hover:bg-[#0F2747]/90 text-white font-bold border-none rounded-lg cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                )}
                                {onDeleteProduct && (
                                  <button
                                    onClick={() => onDeleteProduct(product.id, product.name)}
                                    className="btn btn-xs bg-[#DC2626] hover:bg-[#DC2626]/90 text-white font-bold border-none rounded-lg cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <span className="text-xs bg-slate-100 text-secondary-gray font-medium px-3 py-1.5 rounded">
                              Refinery Lot
                            </span>
                          );
                        }
                      }

                      if (canPlaceOrder) {
                        return (
                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            <button
                              type="button"
                              onClick={() => onAddToCart && onAddToCart(product)}
                              className="btn btn-sm bg-[#0F2747] hover:bg-[#163860] text-white font-bold border-none rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                              title="Add product to multi-delivery cart"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Add to Cart</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onInstantOrder && onInstantOrder(product)}
                              className="btn btn-sm bg-[#F59E0B] hover:bg-[#D97706] text-[#1E293B] font-bold border-none rounded-xl text-xs cursor-pointer shadow-xs"
                            >
                              Buy Now
                            </button>
                          </div>
                        );
                      }

                      return (
                        <span className="text-xs bg-slate-100 text-secondary-gray font-medium px-3 py-1.5 rounded">
                          View only
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
