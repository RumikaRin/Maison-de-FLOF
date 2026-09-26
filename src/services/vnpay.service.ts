import { getVnpayInstance } from "../lib/vnpay.ts";
import type {
  PaymentService,
  CreatePaymentUrlParams,
  PaymentVerificationResult,
  PaymentCallbackQuery,
} from "./payment.service.ts";

export class VNPayService implements PaymentService {
  createPaymentUrl(params: CreatePaymentUrlParams): string {
    const txnRef = params.txnRef || `${params.orderId}_${Date.now()}`;
    const payload = {
      vnp_Amount: params.amount,
      vnp_IpAddr: params.ipAddr,
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: params.orderInfo,
      vnp_ReturnUrl: params.returnUrl,
      ...(params.bankCode ? { vnp_BankCode: params.bankCode } : {}),
    };

    return getVnpayInstance().buildPaymentUrl(payload);
  }

  verifyReturn(query: PaymentCallbackQuery): PaymentVerificationResult {
    const verify = getVnpayInstance().verifyReturnUrl(query as any);
    const rawTxnRef = typeof query.vnp_TxnRef === "string" ? query.vnp_TxnRef : undefined;
    const orderId = rawTxnRef ? rawTxnRef.replace(/_\d+$/, "") : undefined;
    return {
      // The library validates the signature and reports it as `isVerified`,
      // independent of the success response code. Both must hold — otherwise a
      // forged callback carrying vnp_ResponseCode=00 with no valid HMAC would
      // mark an order paid. See order-lifecycle: callers gate on isVerified.
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      message: verify.message,
      orderId,
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : undefined,
      transactionNo: typeof query.vnp_TransactionNo === "string" ? query.vnp_TransactionNo : undefined,
      bankCode: typeof query.vnp_BankCode === "string" ? query.vnp_BankCode : undefined,
      payDate: typeof query.vnp_PayDate === "string" ? query.vnp_PayDate : undefined,
    };
  }

  verifyIpn(query: PaymentCallbackQuery): PaymentVerificationResult {
    const verify = getVnpayInstance().verifyIpnCall(query as any);
    const rawTxnRef = typeof query.vnp_TxnRef === "string" ? query.vnp_TxnRef : undefined;
    const orderId = rawTxnRef ? rawTxnRef.replace(/_\d+$/, "") : undefined;
    return {
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      message: verify.message,
      orderId,
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : undefined,
      transactionNo: typeof query.vnp_TransactionNo === "string" ? query.vnp_TransactionNo : undefined,
      bankCode: typeof query.vnp_BankCode === "string" ? query.vnp_BankCode : undefined,
      payDate: typeof query.vnp_PayDate === "string" ? query.vnp_PayDate : undefined,
    };
  }
}

export const paymentService = new VNPayService();
