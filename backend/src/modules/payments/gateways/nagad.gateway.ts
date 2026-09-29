import crypto from 'crypto';
import { IPaymentGateway, PaymentInitiationResult, PaymentVerificationResult, RefundResult } from '../payment-gateway.interface.js';
import { PaymentMethod, PaymentStatus } from '../../../common/types.js';

export class NagadGateway implements IPaymentGateway {
  async initiatePayment(order: any): Promise<PaymentInitiationResult> {
    const paymentId = crypto.randomUUID();
    const mockPaymentUrl = `https://sandbox.nagad.com.bd/checkout?paymentID=${paymentId}&orderID=${order.order_number}&amount=${order.grand_total}`;

    return {
      paymentId,
      gateway: PaymentMethod.NAGAD,
      amount: order.grand_total,
      currency: 'BDT',
      paymentUrl: mockPaymentUrl,
      status: PaymentStatus.PENDING,
      transactionId: null,
      instructions: 'Complete payment securely via Nagad Gateway URL.',
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    const transactionId = payload.transactionId || `TRX-NAGAD-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;

    return {
      success: true,
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      transactionId,
      amount: payload.amount,
      status: PaymentStatus.PAID,
      message: 'Nagad MFS payment verified successfully',
    };
  }

  async refund(paymentId: string, amount: number, reason: string): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REF-NAGAD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      amount,
      message: `Nagad refund of ৳${amount} completed: ${reason}`,
    };
  }
}
