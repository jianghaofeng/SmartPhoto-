import { loadStripe } from '@stripe/stripe-js';

// 客户端stripe配置 - 只有在有publishable key时才初始化
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export { stripePromise };

// 服务端stripe配置
import Stripe from 'stripe';

// 只有在有secret key时才创建stripe实例
const secretKey = process.env.STRIPE_SECRET_KEY;
export const stripe = secretKey ? new Stripe(secretKey, {
  typescript: true,
}) : null;

// 检查stripe是否已配置的辅助函数
// 客户端只能检查publishable key，服务端检查secret key
export const isStripeConfigured = () => {
  if (typeof window !== 'undefined') {
    // 客户端环境：只检查publishable key
    return !!publishableKey;
  } else {
    // 服务端环境：检查两个key
    return !!(publishableKey && secretKey);
  }
};

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

// 支付相关类型定义
export interface PaymentIntentData {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}