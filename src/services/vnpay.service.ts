import { vnpayInstance } from "@/lib/vnpay";
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

    return vnpayInstance.buildPaymentUrl(payload);
  }

  verifyReturn(query: any): PaymentVerificationResult {
    const verify = vnpayInstance.verifyReturnUrl(query);
    return {
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
    const verify = vnpayInstance.verifyIpnCall(query);
    return {
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
