export interface CreatePaymentUrlParams {
  orderId: string;
  amount: number;
  ipAddr: string;
  returnUrl: string;
  orderInfo: string;
  bankCode?: string; // Optional: To directly select bank in VNPay
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

export interface PaymentService {
  createPaymentUrl(params: CreatePaymentUrlParams): string;
  verifyReturn(query: any): PaymentVerificationResult;
  verifyIpn(query: any): PaymentVerificationResult;
}
