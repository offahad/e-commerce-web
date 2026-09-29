import { PaymentMethod } from '../../common/types.js';
import { IPaymentGateway } from './payment-gateway.interface.js';
import { CodGateway } from './gateways/cod.gateway.js';
import { BkashGateway } from './gateways/bkash.gateway.js';
import { NagadGateway } from './gateways/nagad.gateway.js';

export class PaymentGatewayFactory {
  private static gateways: Map<PaymentMethod, IPaymentGateway> = new Map();

  static {
    this.gateways.set(PaymentMethod.COD, new CodGateway());
    this.gateways.set(PaymentMethod.BKASH, new BkashGateway());
    this.gateways.set(PaymentMethod.NAGAD, new NagadGateway());
    this.gateways.set(PaymentMethod.ROCKET, new BkashGateway()); // Reusable MFS adapter
    this.gateways.set(PaymentMethod.CARD, new BkashGateway());
  }

  static getGateway(method: PaymentMethod): IPaymentGateway {
    const gateway = this.gateways.get(method);
    if (!gateway) {
      throw new Error(`Unsupported payment method: ${method}`);
    }
    return gateway;
  }
}
