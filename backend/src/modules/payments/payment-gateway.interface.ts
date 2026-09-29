import { PaymentMethod, PaymentStatus } from '../../common/types.js';

export interface PaymentInitiationResult {
  paymentId: string;
  gateway: PaymentMethod;
  amount: number;
  currency: string;
  paymentUrl?: string | null;
  status: PaymentStatus;
  transactionId?: string | null;
  instructions?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  orderId: string;
  paymentId: string;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  message: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  message: string;
}

export interface IPaymentGateway {
  initiatePayment(order: any): Promise<PaymentInitiationResult>;
  verifyPayment(payload: any): Promise<PaymentVerificationResult>;
  refund(paymentId: string, amount: number, reason: string): Promise<RefundResult>;
}
