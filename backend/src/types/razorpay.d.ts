declare module 'razorpay' {
  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    created_at: number;
  }

  interface RazorpayPayment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id: string;
    method: string;
    description: string;
    email: string;
    contact: string;
    created_at: number;
  }

  interface RazorpayWebhookPayload {
    event: string;
    payload: {
      payment: {
        entity: RazorpayPayment;
      };
      order: {
        entity: RazorpayOrder;
      };
    };
  }

  class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    orders: {
      create(options: {
        amount: number;
        currency: string;
        receipt: string;
        notes?: Record<string, string>;
      }): Promise<RazorpayOrder>;
      fetch(orderId: string): Promise<RazorpayOrder>;
    };
    payments: {
      fetch(paymentId: string): Promise<RazorpayPayment>;
    };
  }

  export default Razorpay;
  export { RazorpayOrder, RazorpayPayment, RazorpayWebhookPayload };
}
