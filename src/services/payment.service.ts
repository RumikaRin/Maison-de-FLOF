export interface CreatePaymentUrlParams {
  orderId: string;
  amount: number;
  ipAddr: string;
  returnUrl: string;
  orderInfo: string;
  bankCode?: string; // Optional: To directly select bank in VNPay
  txnRef?: string; // Optional: Custom unique transaction reference (e.g. for retries)
}

export interface PaymentVerificationResult {
  /** Cryptographic checksum (HMAC-SHA512) validation of the callback. */
  isVerified: boolean;
  /** Gateway response code says the transaction succeeded (vnp_ResponseCode=00). */
  isSuccess: boolean;
  message: string;
  orderId?: string;
  amount?: number;
  transactionNo?: string;
  bankCode?: string;
  payDate?: string;
}

export type PaymentCallbackQuery = Record<string, string | number | undefined | string[]>;

export interface PaymentService {
  createPaymentUrl(params: CreatePaymentUrlParams): string;
  verifyReturn(query: PaymentCallbackQuery): PaymentVerificationResult;
  verifyIpn(query: PaymentCallbackQuery): PaymentVerificationResult;
}
