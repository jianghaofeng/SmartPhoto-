# Stripe Elements 支付集成

本文档介绍如何在 SmartPhoto 项目中使用 Stripe Elements 进行支付处理。

## 概述

Stripe Elements 是 Stripe 提供的一套预构建的 UI 组件，用于安全地收集支付信息。与传统的重定向到 Stripe Checkout 页面不同，Elements 允许您在自己的网站上嵌入支付表单，提供更好的用户体验。

## 功能特性

- 🔒 **安全性**: 支付信息直接发送到 Stripe，不经过您的服务器
- 🎨 **可定制**: 完全可定制的 UI，与您的品牌保持一致
- 📱 **响应式**: 自动适配移动设备和桌面设备
- 🌍 **国际化**: 支持多种支付方式和货币
- ✅ **实时验证**: 实时验证卡号、过期日期等信息

## 环境配置

### 1. 安装依赖

```bash
bun add @stripe/stripe-js @stripe/react-stripe-js stripe
```

### 2. 环境变量

在 `.env` 文件中添加以下配置：

```env
# Stripe 配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**获取密钥：**

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 在左侧菜单中选择 "Developers" > "API keys"
3. 复制 "Publishable key" 和 "Secret key"

## 核心组件

### 1. Stripe 配置 (`src/lib/stripe.ts`)

```typescript
import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// 客户端 Stripe 实例
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// 服务端 Stripe 实例
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

### 2. 支付意图 API (`src/app/api/stripe/create-payment-intent/route.ts`)

创建支付意图的 API 端点，用于初始化支付流程：

```typescript
export async function POST(request: NextRequest) {
  const { amount, currency = 'usd', productId } = await request.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe 使用分为单位
    currency,
    metadata: { userId: session.user.id, productId },
    automatic_payment_methods: { enabled: true },
  });
  
  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
```

### 3. 支付表单组件 (`src/ui/components/payments/StripePaymentForm.tsx`)

主要的支付表单组件，包含：

- `StripePaymentForm`: 核心支付表单
- `StripePaymentContainer`: 处理支付意图创建的容器组件

## 使用方法

### 基础用法

```tsx
import { StripePaymentContainer } from '@/ui/components/payments/StripePaymentForm';

function PaymentPage() {
  const handleSuccess = () => {
    console.log('支付成功！');
    // 处理支付成功逻辑
  };

  const handleError = (error: string) => {
    console.error('支付失败:', error);
    // 处理支付失败逻辑
  };

  return (
    <StripePaymentContainer
      amount={29.99} // 美元金额
      productId="pro-plan"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  );
}
```

### 高级用法

如果您需要更多控制，可以直接使用 `StripePaymentForm`：

```tsx
import { StripePaymentForm } from '@/ui/components/payments/StripePaymentForm';

function CustomPaymentPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // 创建支付意图
  useEffect(() => {
    fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 29.99 }),
    })
    .then(res => res.json())
    .then(data => setClientSecret(data.clientSecret));
  }, []);

  if (!clientSecret) return <div>加载中...</div>;

  return (
    <StripePaymentForm
      clientSecret={clientSecret}
      amount={2999} // 分为单位
      onSuccess={() => console.log('成功')}
      onError={(error) => console.error(error)}
    />
  );
}
```

## 演示页面

访问 `/stripe-demo` 查看完整的演示页面，包含：

- 动态金额设置
- 实时支付状态
- 测试卡号说明
- 错误处理演示

## 测试

### 测试卡号

Stripe 提供了多种测试卡号用于不同场景：

| 卡号 | 描述 |
|------|------|
| `4242 4242 4242 4242` | 成功支付 |
| `4000 0000 0000 0002` | 卡被拒绝 |
| `4000 0000 0000 9995` | 资金不足 |
| `4000 0000 0000 9987` | 丢失卡片 |
| `4000 0000 0000 9979` | 被盗卡片 |

### 其他测试数据

- **过期日期**: 任何未来日期（如 `12/34`）
- **CVC**: 任何 3 位数字（如 `123`）
- **邮政编码**: 任何 5 位数字（如 `12345`）

## 安全注意事项

1. **密钥管理**: 永远不要在客户端代码中暴露 `STRIPE_SECRET_KEY`
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **验证**: 始终在服务端验证支付结果
4. **Webhook**: 使用 Stripe Webhook 处理异步事件

## 与现有 Polar 集成的关系

本项目同时支持 Polar 和 Stripe 两种支付方式：

- **Polar**: 现有的主要支付处理器，使用重定向模式
- **Stripe Elements**: 新增的嵌入式支付选项，提供更好的用户体验

您可以根据需要选择使用其中一种或同时支持两种支付方式。

## 故障排除

### 常见问题

1. **"Invalid publishable key"**
   - 检查 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 是否正确设置
   - 确保使用的是 `pk_test_` 开头的测试密钥或 `pk_live_` 开头的生产密钥

2. **"No such payment_intent"**
   - 检查 `clientSecret` 是否正确传递
   - 确保支付意图创建成功

3. **支付表单不显示**
   - 检查网络连接
   - 查看浏览器控制台是否有错误
   - 确保所有依赖正确安装

### 调试技巧

1. 使用浏览器开发者工具查看网络请求
2. 检查 Stripe Dashboard 中的日志
3. 启用详细的错误日志记录

## 更多资源

- [Stripe Elements 官方文档](https://stripe.com/docs/stripe-js)
- [React Stripe.js 文档](https://github.com/stripe/react-stripe-js)
- [Stripe API 参考](https://stripe.com/docs/api)
- [支付意图指南](https://stripe.com/docs/payments/payment-intents)
