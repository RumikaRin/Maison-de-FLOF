"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";

interface PersonalInfoTabProps {
  language: string;
  wishlistProducts: any[];
  handleRemoveFavoriteProduct: (id: string) => void;
  profileName: string;
  setProfileName: (val: string) => void;
  profileEmail: string;
  profilePhone: string;
  setProfilePhone: (val: string) => void;
  profileAddress: string;
  setProfileAddress: (val: string) => void;
  handleProfileSubmit: (e: React.FormEvent) => void;
}

export function PersonalInfoTab({
  language,
  wishlistProducts,
  handleRemoveFavoriteProduct,
  profileName,
  setProfileName,
  profileEmail,
  profilePhone,
  setProfilePhone,
  profileAddress,
  setProfileAddress,
  handleProfileSubmit,
}: PersonalInfoTabProps) {
  return (
    <div className="bg-white border border-warm-200/80 p-4 sm:p-6 rounded-2xl shadow-sm text-left">
      <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
        {language === "vi" ? "Sản phẩm đã lưu" : "Saved Products"}
      </h3>
      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {wishlistProducts.map((product) => (
            <div key={product.id} className="relative rounded-2xl border border-warm-200 p-3">
              <Link href={`/products/${product.slug}`} className="block">
                <div className="relative h-32 rounded-xl bg-warm-50">
                  <Image src={getProductImage(product.images)} alt={product.name} fill className="object-contain p-3" />
                </div>
                <h4 className="mt-3 text-xs font-bold text-warm-900">{language === "vi" ? product.name : product.nameEn}</h4>
                <p className="mt-1 text-xs font-bold text-jotun-teal">{formatPrice(product.price * (1 - product.discountPercent / 100))}</p>
              </Link>
              <button
                onClick={() => handleRemoveFavoriteProduct(product.id)}
                className="absolute right-5 top-5 rounded-full bg-white p-1.5 text-rose-500 shadow-sm hover:scale-110 transition-transform"
                aria-label={language === "vi" ? "Bỏ thích sản phẩm" : "Remove favorite product"}
              >
                <Heart className="h-3.5 w-3.5 fill-current" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-8 text-xs text-warm-500">{language === "vi" ? "Bạn chưa lưu sản phẩm nào." : "You have no saved products."}</p>
      )}

      <h3 className="font-serif font-bold text-lg border-b border-warm-100 pb-3 mb-6 text-[#88734C]">
        {language === "vi" ? "Thông tin cá nhân" : "Personal Settings"}
      </h3>

      <form onSubmit={handleProfileSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Họ và tên</label>
            <div className="relative">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                placeholder="Họ và tên"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">
              {language === "vi" ? "Địa chỉ Email (Không thể thay đổi)" : "Email Address (Read-only)"}
            </label>
            <div className="relative">
              <input
                type="email"
                value={profileEmail}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-warm-50/70 text-xs font-semibold text-warm-500 cursor-not-allowed opacity-80 focus:outline-hidden"
                placeholder="Email"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Số điện thoại</label>
            <div className="relative">
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                placeholder="Số điện thoại"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">Địa chỉ nhận hàng</label>
            <div className="relative">
              <input
                type="text"
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs focus:outline-hidden focus:ring-2 focus:ring-jotun-teal/30 focus:border-jotun-teal transition-all font-semibold text-warm-800"
                placeholder="Địa chỉ"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-warm-900 hover:bg-warm-850 text-white text-xs font-bold px-6 py-3 mt-2 rounded-xl transition-all shadow-sm self-start"
        >
          Lưu thay đổi
        </button>
      </form>
    </div>
  );
}
