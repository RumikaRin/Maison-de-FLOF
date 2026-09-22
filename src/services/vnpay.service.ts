import { getVnpayInstance } from "@/lib/vnpay";
import {
  PaymentService,
  CreatePaymentUrlParams,
  PaymentVerificationResult,
  PaymentCallbackQuery,
} from "./payment.service";

export class VNPayService implements PaymentService {
  createPaymentUrl(params: CreatePaymentUrlParams): string {
    const payload = {
      vnp_Amount: params.amount,
      vnp_IpAddr: params.ipAddr,
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_ReturnUrl: params.returnUrl,
      ...(params.bankCode ? { vnp_BankCode: params.bankCode } : {}),
    };

    return getVnpayInstance().buildPaymentUrl(payload);
  }

  verifyReturn(query: PaymentCallbackQuery): PaymentVerificationResult {
    const verify = getVnpayInstance().verifyReturnUrl(query as any);
    return {
      // The library validates the signature and reports it as `isVerified`,
      // independent of the success response code. Both must hold — otherwise a
      // forged callback carrying vnp_ResponseCode=00 with no valid HMAC would
      // mark an order paid. See order-lifecycle: callers gate on isVerified.
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      message: verify.message,
      orderId: typeof query.vnp_TxnRef === "string" ? query.vnp_TxnRef : undefined,
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : undefined,
      transactionNo: typeof query.vnp_TransactionNo === "string" ? query.vnp_TransactionNo : undefined,
      bankCode: typeof query.vnp_BankCode === "string" ? query.vnp_BankCode : undefined,
      payDate: typeof query.vnp_PayDate === "string" ? query.vnp_PayDate : undefined,
    };
  }

  verifyIpn(query: PaymentCallbackQuery): PaymentVerificationResult {
    const verify = getVnpayInstance().verifyIpnCall(query as any);
    return {
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      message: verify.message,
      orderId: typeof query.vnp_TxnRef === "string" ? query.vnp_TxnRef : undefined,
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : undefined,
      transactionNo: typeof query.vnp_TransactionNo === "string" ? query.vnp_TransactionNo : undefined,
      bankCode: typeof query.vnp_BankCode === "string" ? query.vnp_BankCode : undefined,
      payDate: typeof query.vnp_PayDate === "string" ? query.vnp_PayDate : undefined,
    };
  }
}

export const paymentService = new VNPayService();
