export interface VietQrOptions {
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  amount: number;
  orderNumber: string;
}

export const DEFAULT_VIETQR_CONFIG = {
  bankId: "vietcombank",
  accountNo: "1028372615",
  accountName: "CONG TY TNHH MAISON DE FLOF",
} as const;

/**
 * Generates a dynamic VietQR image URL with pre-filled amount and order message.
 * Compatible with all Napas 247 banking apps in Vietnam.
 */
export function generateVietQrUrl(options: VietQrOptions): string {
  const bank = options.bankId || DEFAULT_VIETQR_CONFIG.bankId;
  const account = options.accountNo || DEFAULT_VIETQR_CONFIG.accountNo;
  const name = options.accountName || DEFAULT_VIETQR_CONFIG.accountName;
  const amount = Math.max(0, Math.round(options.amount));
  const addInfo = options.orderNumber.trim();

  const query = new URLSearchParams({
    amount: amount.toString(),
    addInfo,
    accountName: name,
  });

  return `https://img.vietqr.io/image/${bank}-${account}-compact2.png?${query.toString()}`;
}
