import { type NextRequest, NextResponse } from "next/server";

import { auth } from "~/lib/auth";
import { isStripeConfigured, stripe } from "~/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    // 检查stripe是否已配置
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: "Stripe 未配置，请联系管理员" },
        { status: 503 },
      );
    }

    // 验证用户身份
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { amount, cancelUrl, productName, successUrl } = await request.json();

    // 验证金额
    if (!amount || amount < 0.5) {
      return NextResponse.json(
        { error: "支付金额必须大于等于 $0.50" },
        { status: 400 },
      );
    }
    // 创建Checkout会话
    const checkoutSession = await stripe.checkout.sessions.create({
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName || "Stripe Demo Product",
            },
            unit_amount: Math.round(amount * 100), // stripe使用分为单位
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
      },
      mode: "payment",
      payment_method_types: ["card"],
      success_url: successUrl,
    });
    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("创建Checkout会话失败:", error);
    return NextResponse.json(
      { error: "创建Checkout会话失败" },
      { status: 500 },
    );
  }
}