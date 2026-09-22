/**
 * Logistics rate estimation module for FLOF Paint.
 * Calculates reference delivery fees and delivery times for Vietnamese couriers:
 * - GHTK (Giao Hàng Tiết Kiệm)
 * - GHN (Giao Hàng Nhanh)
 * - Viettel Post
 *
 * Extensible interface allows plugging in live carrier APIs when credentials are ready.
 */

export type CarrierId = "GHTK" | "GHN" | "VIETTEL_POST";

export interface CarrierQuote {
  carrierId: CarrierId;
  carrierName: string;
  shortName: string;
  estimatedFee: number;
  estimatedDays: string;
  serviceType: string;
  note: string;
  isApiReady: boolean;
}

export interface ShippingEstimateResult {
  totalWeightKg: number;
  originProvince: string;
  destinationProvince: string;
  regionType: "INTRA_CITY" | "INTRA_REGION" | "INTER_REGION";
  quotes: CarrierQuote[];
  cheapestCarrierId: CarrierId;
  fastestCarrierId: CarrierId;
}

export interface MinimalCartItem {
  paint: {
    volume?: number;
    volumeUnit?: string;
  };
  quantity: number;
}

/**
 * Interface to plug in live carrier API adapters in future phases.
 */
export interface LiveCarrierAdapter {
  carrierId: CarrierId;
  fetchLiveQuote: (params: {
    weightKg: number;
    province: string;
    district?: string;
  }) => Promise<CarrierQuote | null>;
}

// Density of paint is approximately 1.3kg per Liter
const PAINT_DENSITY_KG_PER_LITER = 1.3;
const DEFAULT_ORIGIN_PROVINCE = "Thành phố Hà Nội";

const NORTH_PROVINCES = [
  "Thành phố Hà Nội",
  "Thành phố Hải Phòng",
  "Tỉnh Quảng Ninh",
  "Tỉnh Bắc Ninh",
  "Tỉnh Hải Dương",
  "Tỉnh Hưng Yên",
  "Tỉnh Hà Nam",
  "Tỉnh Nam Định",
  "Tỉnh Thái Bình",
  "Tỉnh Ninh Bình",
  "Tỉnh Vĩnh Phúc",
  "Tỉnh Phú Thọ",
  "Tỉnh Thái Nguyên",
  "Tỉnh Bắc Giang",
  "Tỉnh Hòa Bình",
  "Tỉnh Lạng Sơn",
  "Tỉnh Tuyên Quang",
  "Tỉnh Yên Bái",
  "Tỉnh Lào Cai",
  "Tỉnh Cao Bằng",
  "Tỉnh Bắc Kạn",
  "Tỉnh Hà Giang",
  "Tỉnh Sơn La",
  "Tỉnh Điện Biên",
  "Tỉnh Lai Châu",
];

function normalizeStr(val: string): string {
  return val
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

export function detectRegion(destProvince: string): "INTRA_CITY" | "INTRA_REGION" | "INTER_REGION" {
  if (!destProvince) return "INTRA_CITY";
  const norm = normalizeStr(destProvince);

  if (norm.includes("ha noi")) {
    return "INTRA_CITY";
  }

  const isNorth = NORTH_PROVINCES.some((p) => normalizeStr(p).includes(norm) || norm.includes(normalizeStr(p)));
  if (isNorth) {
    return "INTRA_REGION";
  }

  return "INTER_REGION";
}

/**
 * Calculates paint total weight in kg from cart items.
 */
export function calculateCartWeightKg(items: MinimalCartItem[]): number {
  if (!items || items.length === 0) return 1;

  const totalKg = items.reduce((sum, item) => {
    const vol = item.paint.volume && item.paint.volume > 0 ? item.paint.volume : 1;
    const itemWeight = vol * PAINT_DENSITY_KG_PER_LITER * (item.quantity || 1);
    return sum + itemWeight;
  }, 0);

  return Math.max(1, Math.round(totalKg * 10) / 10);
}

/**
 * Calculates carrier reference shipping rates.
 * Extensible for live carrier API integrations.
 */
export function calculateCarrierQuotes(
  items: MinimalCartItem[],
  destinationProvince: string,
): ShippingEstimateResult {
  const totalWeightKg = calculateCartWeightKg(items);
  const regionType = detectRegion(destinationProvince);
  const extraKg = Math.max(0, totalWeightKg - 3);

  // Reference pricing formulas (VND) based on published courier standard tariff tables:
  let ghtkFee: number;
  let ghtkDays: string;
  let ghnFee: number;
  let ghnDays: string;
  let vtpFee: number;
  let vtpDays: string;

  switch (regionType) {
    case "INTRA_CITY":
      ghtkFee = 22000 + Math.ceil(extraKg) * 5000;
      ghtkDays = "1 - 2 ngày";
      ghnFee = 24000 + Math.ceil(extraKg) * 5500;
      ghnDays = "1 - 2 ngày";
      vtpFee = 20000 + Math.ceil(extraKg) * 4000;
      vtpDays = "1 - 3 ngày";
      break;

    case "INTRA_REGION":
      ghtkFee = 35000 + Math.ceil(extraKg) * 7000;
      ghtkDays = "2 - 3 ngày";
      ghnFee = 38000 + Math.ceil(extraKg) * 7500;
      ghnDays = "2 - 3 ngày";
      vtpFee = 32000 + Math.ceil(extraKg) * 6000;
      vtpDays = "2 - 4 ngày";
      break;

    case "INTER_REGION":
    default:
      ghtkFee = 45000 + Math.ceil(extraKg) * 9000;
      ghtkDays = "3 - 4 ngày";
      ghnFee = 50000 + Math.ceil(extraKg) * 10000;
      ghnDays = "3 - 4 ngày";
      vtpFee = 40000 + Math.ceil(extraKg) * 7500;
      vtpDays = "3 - 5 ngày";
      break;
  }

  const quotes: CarrierQuote[] = [
    {
      carrierId: "GHTK",
      carrierName: "Giao Hàng Tiết Kiệm",
      shortName: "GHTK",
      estimatedFee: ghtkFee,
      estimatedDays: ghtkDays,
      serviceType: "Đường bộ tiêu chuẩn",
      note: "Phù hợp kiện sơn đóng thùng vừa & nhỏ",
      isApiReady: false,
    },
    {
      carrierId: "GHN",
      carrierName: "Giao Hàng Nhanh",
      shortName: "GHN",
      estimatedFee: ghnFee,
      estimatedDays: ghnDays,
      serviceType: "Chuyển phát nhanh",
      note: "Mạng lưới bưu cục dày đặc, giao hỏa tốc",
      isApiReady: false,
    },
    {
      carrierId: "VIETTEL_POST",
      carrierName: "Viettel Post",
      shortName: "ViettelPost",
      estimatedFee: vtpFee,
      estimatedDays: vtpDays,
      serviceType: "Chuyển phát tiết kiệm / VTK",
      note: "Ưu tiên tối ưu cước cho thùng sơn dung tích lớn (5L - 18L)",
      isApiReady: false,
    },
  ];

  quotes.sort((a, b) => a.estimatedFee - b.estimatedFee);

  return {
    totalWeightKg,
    originProvince: DEFAULT_ORIGIN_PROVINCE,
    destinationProvince: destinationProvince || "Thành phố Hà Nội",
    regionType,
    quotes,
    cheapestCarrierId: quotes[0].carrierId,
    fastestCarrierId: "GHN",
  };
}
