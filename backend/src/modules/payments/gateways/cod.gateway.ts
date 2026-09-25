import crypto from 'crypto';
import { IPaymentGateway, PaymentInitiationResult, PaymentVerificationResult, RefundResult } from '../payment-gateway.interface.js';
import { PaymentMethod, PaymentStatus } from '../../../common/types.js';

export class CodGateway implements IPaymentGateway {
  async initiatePayment(order: any): Promise<PaymentInitiationResult> {
    return {
      paymentId: crypto.randomUUID(),
      gateway: PaymentMethod.COD,
      amount: order.grand_total,
      currency: order.currency || 'BDT',
      paymentUrl: null,
      status: PaymentStatus.PENDING,
      transactionId: `COD-${order.order_number}`,
      instructions: 'Pay in cash upon doorstep delivery to the Liton Brothers courier.',
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    return {
      success: true,
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      transactionId: payload.transactionId || `COD-VERIFIED-${Date.now()}`,
      amount: payload.amount,
      status: PaymentStatus.PAID,
      message: 'Cash received upon delivery successfully recorded.',
    };
  }

  async refund(paymentId: string, amount: number, reason: string): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REFUND-COD-${crypto.randomUUID().slice(0, 8)}`,
      amount,
      message: `Cash refund approved: ${reason}`,
    };
  }
}
