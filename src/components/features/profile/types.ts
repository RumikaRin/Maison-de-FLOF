export type ProfileTab =
  | "history"
  | "profile"
  | "password"
  | "addresses"
  | "favorites"
  | "sessions"
  | "privacy";

export interface ProfileAddress {
  id: string;
  name: string;
  phone: string;
  province: string;
  district: string;
  address: string;
  isDefault: boolean;
}

export interface FavoriteProduct {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  price: number;
  discountPercent: number;
  images: string[];
}

export interface ProfileColor {
  code: string;
  name: string;
  nameEn?: string;
  hex: string;
}

export interface ProfileOrderItem {
  name?: string;
  quantity?: number;
  paint?: {
    name?: string;
  };
}

export interface ProfileOrder {
  id: string;
  date: string;
  status: string;
  items: string | Array<string | ProfileOrderItem>;
  total: number;
}
