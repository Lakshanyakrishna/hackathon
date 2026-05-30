import api from './api';

export interface OrderResponse {
  id: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  registrationId: string;
}

export interface Payment {
  id: string;
  registrationId: string;
  userId: string;
  amount: string;
  currency: string;
  status: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}

export const paymentService = {
  createOrder: (registrationId: string) =>
    api.post<OrderResponse>('/payments/create-order', { registrationId }),

  list: () => api.get<Payment[]>('/payments'),

  getById: (id: string) => api.get<Payment>(`/payments/${id}`),

  openRazorpay: (order: OrderResponse, onSuccess: (paymentId: string) => void, onError?: (err: unknown) => void) => {
    const options: RazorpayOptions = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'HackHub',
      description: `Registration payment (${order.registrationId.slice(0, 8)})`,
      order_id: order.razorpayOrderId,
      handler: (response) => {
        onSuccess(response.razorpay_payment_id);
      },
      theme: { color: '#8b5cf6' },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  },
};
