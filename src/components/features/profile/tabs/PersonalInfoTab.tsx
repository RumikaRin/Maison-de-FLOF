/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { CspImage as Image } from "@/components/ui/csp-image";
import Link from "next/link";
import { toast } from "@/components/ui/csp-toast";
import { formatPrice } from "@/lib/utils";
import { getProductImage } from "@/lib/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rule } from "@/components/ui/editorial";
import type { FavoriteProduct } from "../types";

interface PersonalInfoTabProps {
  language: string;
  wishlistProducts: FavoriteProduct[];
  handleRemoveFavoriteProduct: (id: string) => void;
  profileName: string;
  setProfileName: (val: string) => void;
  profileEmail: string;
  profilePhone: string;
  setProfilePhone: (val: string) => void;
  profileAddress: string;
  setProfileAddress: (val: string) => void;
  handleProfileSubmit: (e: React.FormEvent) => void;
  emailVerified: boolean;
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
  emailVerified,
}: PersonalInfoTabProps) {
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profileEmail }),
      });
      if (!response.ok) throw new Error();
      toast.success(
        language === "vi"
          ? "Đã gửi liên kết xác minh. Hãy kiểm tra hộp thư của bạn."
          : "Verification link sent. Check your inbox.",
      );
    } catch {
      toast.error(
        language === "vi"
          ? "Không gửi được email xác minh. Vui lòng thử lại."
          : "Could not send the verification email. Please try again.",
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  return (
    <div className="text-left">
      {/* Saved products — hairline ledger rows */}
      <section>
        <h2 className="fl-display text-fl-xl">
          {language === "vi" ? "Sản phẩm đã lưu" : "Saved Products"}
        </h2>
        <Rule weight="strong" className="mt-fl-xs" />
        {wishlistProducts.length > 0 ? (
          <ul>
            {wishlistProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-fl-sm border-b border-atelier-rule py-fl-xs"
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="flex min-w-0 items-center gap-fl-sm"
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-surface border border-atelier-rule bg-atelier-paper-2">
                    <Image src={getProductImage(product.images)} alt={product.name} fill className="object-contain p-1.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-fl-sm font-medium text-atelier-ink">
                      {language === "vi" ? product.name : product.nameEn}
                    </span>
                    <span className="block text-fl-sm tabular-nums text-atelier-ink-2">
                      {formatPrice(product.price * (1 - product.discountPercent / 100))}
                    </span>
                  </span>
                </Link>
                <button
                  onClick={() => handleRemoveFavoriteProduct(product.id)}
                  aria-label={language === "vi" ? "Bỏ thích sản phẩm" : "Remove favorite product"}
                  className="min-h-11 shrink-0 whitespace-nowrap text-fl-xs text-atelier-ink-2 underline decoration-1 underline-offset-4 transition-colors duration-fl-fast ease-fl-out hover:text-atelier-danger md:min-h-6"
                >
                  {language === "vi" ? "Bỏ lưu" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-fl-sm text-fl-sm text-atelier-ink-2">
            {language === "vi" ? "Bạn chưa lưu sản phẩm nào." : "You have no saved products."}
          </p>
        )}
      </section>

      {/* Personal settings */}
      <section className="mt-fl-xl">
        <h2 className="fl-display text-fl-xl">
          {language === "vi" ? "Thông tin cá nhân" : "Personal Settings"}
        </h2>
        <Rule weight="strong" className="mt-fl-xs" />

        <form onSubmit={handleProfileSubmit} className="mt-fl-md flex flex-col gap-fl-sm">
          <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-2">
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="profile-name">Họ và tên</Label>
              <Input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Họ và tên"
              />
            </div>

            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="profile-email">
                {language === "vi" ? "Địa chỉ Email (Không thể thay đổi)" : "Email Address (Read-only)"}
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={profileEmail}
                disabled
                placeholder="Email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-fl-sm md:grid-cols-2">
            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="profile-phone">Số điện thoại</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="Số điện thoại"
              />
            </div>

            <div className="flex flex-col gap-fl-2xs">
              <Label htmlFor="profile-address">Địa chỉ nhận hàng</Label>
              <Input
                id="profile-address"
                type="text"
                value={profileAddress}
                onChange={(e) => setProfileAddress(e.target.value)}
                placeholder="Địa chỉ"
              />
            </div>
          </div>

          <Button type="submit" className="mt-fl-2xs self-start">
            Lưu thay đổi
          </Button>
        </form>
      </section>

      {/* Email verification — optional, on demand. Verifying protects account
          recovery; it is not required to browse or buy. */}
      <section className="mt-fl-xl">
        <h2 className="fl-display text-fl-xl">
          {language === "vi" ? "Xác minh email" : "Email verification"}
        </h2>
        <Rule weight="strong" className="mt-fl-xs" />

        <div className="flex flex-wrap items-baseline justify-between gap-fl-sm border-b border-atelier-rule py-fl-sm">
          <div className="min-w-0">
            <p className="fl-label">
              {language === "vi" ? "Trạng thái" : "Status"}
            </p>
            <p
              className={
                emailVerified
                  ? "mt-fl-3xs text-fl-sm text-atelier-success"
                  : "mt-fl-3xs text-fl-sm text-atelier-ink"
              }
            >
              {emailVerified
                ? language === "vi"
                  ? "Đã xác minh"
                  : "Verified"
                : language === "vi"
                  ? "Chưa xác minh — bạn vẫn dùng được đầy đủ tài khoản"
                  : "Not verified — your account still works in full"}
            </p>
          </div>

          {!emailVerified && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSendVerification}
              disabled={isSendingVerification}
              data-state={isSendingVerification ? "loading" : undefined}
              className="shrink-0"
            >
              {isSendingVerification
                ? language === "vi"
                  ? "Đang gửi…"
                  : "Sending…"
                : language === "vi"
                  ? "Gửi liên kết xác minh"
                  : "Send verification link"}
            </Button>
          )}
        </div>

        {!emailVerified && (
          <p className="fl-measure mt-fl-xs text-fl-sm text-atelier-ink-2">
            {language === "vi"
              ? "Xác minh giúp bạn lấy lại tài khoản khi quên mật khẩu. Bạn có thể làm việc này bất cứ lúc nào."
              : "Verifying makes account recovery possible if you forget your password. You can do it at any time."}
          </p>
        )}
      </section>
    </div>
  );
}
