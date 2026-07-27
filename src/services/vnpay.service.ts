import { getVnpayInstance } from "@/lib/vnpay";
import { PaymentService, CreatePaymentUrlParams, PaymentVerificationResult } from "./payment.service";

export class VNPayService implements PaymentService {
  createPaymentUrl(params: CreatePaymentUrlParams): string {
    const payload: any = {
      vnp_Amount: params.amount,
      vnp_IpAddr: params.ipAddr,
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_ReturnUrl: params.returnUrl,
    };
    
    if (params.bankCode) {
        payload.vnp_BankCode = params.bankCode;
    }

    return getVnpayInstance().buildPaymentUrl(payload);
  }

  verifyReturn(query: any): PaymentVerificationResult {
    const verify = getVnpayInstance().verifyReturnUrl(query);
    return {
      // The library validates the signature and reports it as `isVerified`,
      // independent of the success response code. Both must hold — otherwise a
      // forged callback carrying vnp_ResponseCode=00 with no valid HMAC would
      // mark an order paid. See order-lifecycle: callers gate on isVerified.
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      message: verify.message,
      orderId: query.vnp_TxnRef,
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : undefined,
      transactionNo: query.vnp_TransactionNo,
      bankCode: query.vnp_BankCode,
      payDate: query.vnp_PayDate,
    };
  }

  verifyIpn(query: any): PaymentVerificationResult {
    const verify = getVnpayInstance().verifyIpnCall(query);
    return {
      isVerified: verify.isVerified,
      isSuccess: verify.isSuccess,
      message: verify.message,
      orderId: query.vnp_TxnRef,
      amount: query.vnp_Amount ? Number(query.vnp_Amount) / 100 : undefined,
      transactionNo: query.vnp_TransactionNo,
      bankCode: query.vnp_BankCode,
      payDate: query.vnp_PayDate,
    };
  }
}

export const paymentService = new VNPayService();
