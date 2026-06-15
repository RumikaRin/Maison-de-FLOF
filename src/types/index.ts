export interface Category {
  id: string;
  name: string;
  nameEn: string;
  slug: string;
}

export interface Supplier {
  id: string;
  name: string;
  slug: string;
}

export interface PaintColor {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  hex: string;
  toneFamily?: string;
  colorFamily?: string;
}

export interface Paint {
  id: string;
  sku: string;
  name: string;
  nameEn: string;
  slug: string;
  categoryId: string;
  supplierId: string;
  description: string;
  descriptionEn: string;
  features: string;
  featuresEn: string;
  application: string;
  specifications: string;
  coverage: number; // m2/liter/coat
  coatsRequired: number;
  dryingTime: string;
  paintType: string; // INTERIOR | EXTERIOR | PRIMER | WATERPROOF | etc.
  finish: string; // MATTE | EGGSHELL | SATIN | SEMI_GLOSS | GLOSS
  surfaces: string[];
  volume: number;
  volumeUnit: string;
  price: number;
  costPrice?: number;
  stock: number;
  images: string[];
  colors: string[]; // Color codes
  discountPercent?: number | null;
}

export interface BlogPost {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  summary: string;
  summaryEn: string;
  content?: string;
  contentEn?: string;
  image: string;
  category: string;
  categoryEn: string;
  author: string;
  readTime: string;
  createdAt: string;
}

export type Blog = BlogPost;
