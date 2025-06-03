import { type NextRequest, NextResponse } from "next/server";

import { auth } from "~/lib/auth";
import { isStripeConfigured, stripe } from "~/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    // 检查stripe是否已配置
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: "Stripe 未配置，请联系管理员" },
        { status: 503 }
      );
    }

    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { amount, currency = "usd", productId } = await request.json();

    // 验证金额
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "无效的金额" }, { status: 400 });
    }

    // 创建支付意图
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // stripe使用分为单位
      automatic_payment_methods: {
        enabled: true,
      },
      currency,
      metadata: {
        productId: productId || "",
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("创建支付意图失败:", error);
    return NextResponse.json({ error: "创建支付意图失败" }, { status: 500 });
  }
}
