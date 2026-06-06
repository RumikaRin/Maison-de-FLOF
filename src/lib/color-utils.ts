export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

// Convert Hex string to RGB object
export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace(/^#/, "");
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to Hex string
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert Hex to HSL
export function hexToHsl(hex: string): HSL {
  let { r, g, b } = hexToRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// Shift hue of a hex color
export function shiftHue(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  const newHue = (hsl.h + amount + 360) % 360;
  return hslToHex(newHue, hsl.s, hsl.l);
}

// Get complementary color (180 degrees shift)
export function getComplementaryColors(hex: string): string[] {
  return [shiftHue(hex, 180)];
}

// Get analogous colors (+30 and -30 degrees shift)
export function getAnalogousColors(hex: string): string[] {
  return [shiftHue(hex, -30), shiftHue(hex, 30)];
}

// Get triadic colors (+120 and -120 degrees shift)
export function getTriadicColors(hex: string): string[] {
  return [shiftHue(hex, -120), shiftHue(hex, 120)];
}

// Calculate color distance (Euclidean RGB)
export function colorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

interface MinimialPaintColor {
  id: string;
  code: string;
  name: string;
  hex: string;
}

// Find closest color in the palette
export function findClosestColor<T extends MinimialPaintColor>(hex: string, palette: T[]): T | null {
  if (!palette || palette.length === 0) return null;
  let closest: T = palette[0];
  let minDistance = colorDistance(hex, closest.hex);

  for (let i = 1; i < palette.length; i++) {
    const dist = colorDistance(hex, palette[i].hex);
    if (dist < minDistance) {
      minDistance = dist;
      closest = palette[i];
    }
  }

  return closest;
}

export const PALETTE_COLORS = [
  // White
  { code: "0001", name: "Trắng Tinh Khôi", nameEn: "Pure White", hex: "#FFFFFF", toneFamily: "neutral", colorFamily: "white" },
  { code: "1001", name: "Trắng Ngà", nameEn: "Ivory White", hex: "#F5F0E8", toneFamily: "warm", colorFamily: "white" },
  { code: "1002", name: "Trắng Sữa", nameEn: "Milk White", hex: "#FFF8F0", toneFamily: "warm", colorFamily: "white" },
  { code: "1003", name: "Trắng Ánh Bạc", nameEn: "Silver White", hex: "#F2F4F5", toneFamily: "cool", colorFamily: "white" },
  // Beige
  { code: "2001", name: "Kem Vani", nameEn: "Vanilla Cream", hex: "#F3E5D0", toneFamily: "warm", colorFamily: "beige" },
  { code: "2002", name: "Be Cát", nameEn: "Desert Sand", hex: "#D4C4A8", toneFamily: "warm", colorFamily: "beige" },
  { code: "2003", name: "Nâu Sữa Nhạt", nameEn: "Latte Light", hex: "#EADCC9", toneFamily: "warm", colorFamily: "beige" },
  // Grey
  { code: "3001", name: "Xám Nhạt", nameEn: "Light Grey", hex: "#D3D3D3", toneFamily: "neutral", colorFamily: "grey" },
  { code: "3002", name: "Xám Bạc", nameEn: "Silver Grey", hex: "#C0C0C0", toneFamily: "cool", colorFamily: "grey" },
  { code: "3003", name: "Xám Than", nameEn: "Charcoal Grey", hex: "#4A4A4A", toneFamily: "neutral", colorFamily: "grey" },
  { code: "3004", name: "Xám Sương Mù", nameEn: "Mist Grey", hex: "#E2E5E6", toneFamily: "cool", colorFamily: "grey" },
  // Yellow
  { code: "4001", name: "Vàng Chanh", nameEn: "Lemon Yellow", hex: "#F7E856", toneFamily: "warm", colorFamily: "yellow" },
  { code: "4002", name: "Vàng Nắng", nameEn: "Sunny Gold", hex: "#FFD93D", toneFamily: "warm", colorFamily: "yellow" },
  { code: "4003", name: "Vàng Hoa Cúc", nameEn: "Marigold", hex: "#F2C94C", toneFamily: "warm", colorFamily: "yellow" },
  // Orange
  { code: "5001", name: "Cam San Hô", nameEn: "Coral Orange", hex: "#FF7F50", toneFamily: "warm", colorFamily: "orange" },
  { code: "5002", name: "Cam Đất Ấm", nameEn: "Terracotta", hex: "#CC7722", toneFamily: "earth", colorFamily: "orange" },
  // Red
  { code: "6001", name: "Đỏ Rượu Vang", nameEn: "Wine Red", hex: "#722F37", toneFamily: "bold", colorFamily: "red" },
  { code: "6002", name: "Đỏ Gạch", nameEn: "Brick Red", hex: "#CB4154", toneFamily: "bold", colorFamily: "red" },
  // Blue
  { code: "7001", name: "Xanh Biển Khơi", nameEn: "Ocean Blue", hex: "#0077B6", toneFamily: "cool", colorFamily: "blue" },
  { code: "7002", name: "Xanh Pastel", nameEn: "Pastel Blue", hex: "#AEC6CF", toneFamily: "pastel", colorFamily: "blue" },
  { code: "7003", name: "Xanh Teal Cao Cấp", nameEn: "Teal Blue", hex: "#008080", toneFamily: "bold", colorFamily: "blue" },
  // Green
  { code: "8001", name: "Xanh Lá Mạ", nameEn: "Light Green", hex: "#77DD77", toneFamily: "pastel", colorFamily: "green" },
  { code: "8002", name: "Xanh Rêu", nameEn: "Moss Green", hex: "#4A6741", toneFamily: "earth", colorFamily: "green" },
  { code: "8003", name: "Xanh Olive", nameEn: "Olive Green", hex: "#808000", toneFamily: "earth", colorFamily: "green" },
  // Brown
  { code: "9001", name: "Nâu Gỗ Nhạt", nameEn: "Wood Brown", hex: "#8B4513", toneFamily: "earth", colorFamily: "brown" },
  { code: "9002", name: "Nâu Cà Phê", nameEn: "Coffee Brown", hex: "#6F4E37", toneFamily: "earth", colorFamily: "brown" }
];
