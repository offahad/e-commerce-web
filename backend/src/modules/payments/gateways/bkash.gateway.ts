import crypto from 'crypto';
import { IPaymentGateway, PaymentInitiationResult, PaymentVerificationResult, RefundResult } from '../payment-gateway.interface.js';
import { PaymentMethod, PaymentStatus } from '../../../common/types.js';

export class BkashGateway implements IPaymentGateway {
  async initiatePayment(order: any): Promise<PaymentInitiationResult> {
    const paymentId = crypto.randomUUID();
    const mockPaymentUrl = `https://sandbox.payment.bkash.com/checkout?paymentID=${paymentId}&orderID=${order.order_number}&amount=${order.grand_total}`;

    return {
      paymentId,
      gateway: PaymentMethod.BKASH,
      amount: order.grand_total,
      currency: 'BDT',
      paymentUrl: mockPaymentUrl,
      status: PaymentStatus.PENDING,
      transactionId: null,
      instructions: 'Complete payment securely via bKash Checkout URL or enter transaction ID.',
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    const transactionId = payload.transactionId || `TRX-BKASH-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;

    // Verify format or mock validity
    if (!payload.transactionId && !payload.paymentId) {
      return {
        success: false,
        orderId: payload.orderId,
        paymentId: payload.paymentId,
        transactionId: '',
        amount: payload.amount || 0,
        status: PaymentStatus.FAILED,
        message: 'Invalid bKash payment verification parameters',
      };
    }

    return {
      success: true,
      orderId: payload.orderId,
      paymentId: payload.paymentId,
      transactionId,
      amount: payload.amount,
      status: PaymentStatus.PAID,
      message: 'bKash MFS payment verified successfully',
    };
  }

  async refund(paymentId: string, amount: number, reason: string): Promise<RefundResult> {
    return {
      success: true,
      refundId: `REF-BKASH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      amount,
      message: `bKash refund of ৳${amount} completed: ${reason}`,
    };
  }
}
