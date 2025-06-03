"use client";

import { CheckCircle, ExternalLink, XCircle } from "lucide-react";
import React, { useState } from "react";

import { StripePaymentContainer } from "~/ui/components/payments/StripePaymentForm";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

export default function StripeDemoPage() {
  const [amount, setAmount] = useState(29.99);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "error" | "idle" | "success"
  >("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState("elements");

  const handleStartPayment = () => {
    setShowPayment(true);
    setPaymentStatus("idle");
    setStatusMessage("");
  };

  const handleCheckoutPayment = async () => {
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        body: JSON.stringify({
          amount,
          cancelUrl: `${window.location.origin}/stripe-demo?canceled=true`,
          productName: "Stripe Demo Product",
          successUrl: `${window.location.origin}/stripe-demo?success=true`,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("创建Checkout会话失败:", error);
      setPaymentStatus("error");
      setStatusMessage("创建支付会话失败，请重试");
    }
  };

  const createPaymentLink = () => {
    // 这里模拟Payment Link的创建过程
    // 实际使用中，Payment Link通常在Stripe Dashboard中预先创建
    const paymentLinkUrl = `https://buy.stripe.com/test_demo_link?amount=${Math.round(
      amount * 100
    )}`;
    window.open(paymentLinkUrl, "_blank");
  };

  const handlePaymentSuccess = () => {
    setPaymentStatus("success");
    setStatusMessage("支付成功！感谢您的购买。");
    setShowPayment(false);
  };

  const handlePaymentError = (error: string) => {
    setPaymentStatus("error");
    setStatusMessage(error);
  };

  const resetDemo = () => {
    setShowPayment(false);
    setPaymentStatus("idle");
    setStatusMessage("");
  };
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-900">
            Stripe 支付方式演示
          </h1>
          <p className="text-gray-600">体验三种不同的 Stripe 支付集成方式</p>
        </div>

        <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="elements">Stripe Elements</TabsTrigger>
            <TabsTrigger value="checkout">Stripe Checkout</TabsTrigger>
            <TabsTrigger value="payment-link">Payment Link</TabsTrigger>
          </TabsList>

          {/* Stripe Elements */}
          <TabsContent className="space-y-8" value="elements">
            <div
              className={`
              grid gap-8
              md:grid-cols-2
            `}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Stripe Elements 配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount-elements">支付金额 (USD)</Label>
                    <Input
                      disabled={showPayment}
                      id="amount-elements"
                      min="0.50"
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0.5) {
                          setAmount(value);
                        } else if (e.target.value === "") {
                          setAmount(0.5);
                        }
                      }}
                      step="0.01"
                      type="number"
                      value={amount}
                    />
                  </div>
                  <div className="pt-4">
                    {!showPayment ? (
                      <Button
                        className="w-full"
                        disabled={amount < 0.5}
                        onClick={handleStartPayment}
                      >
                        开始支付 ${amount.toFixed(2)}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={resetDemo}
                        variant="outline"
                      >
                        重置演示
                      </Button>
                    )}
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-sm text-blue-800">
                      <strong>特点:</strong>{" "}
                      完全可定制的支付表单，嵌入在您的网站中，提供无缝的用户体验。
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div>
                {showPayment ? (
                  <StripePaymentContainer
                    amount={amount}
                    onError={handlePaymentError}
                    onSuccess={handlePaymentSuccess}
                    productId="demo-product"
                  />
                ) : (
                  <Card>
                    <CardContent
                      className={`
                      flex h-64 items-center justify-center
                    `}
                    >
                      <div className="text-center text-gray-500">
                        <p className="mb-2 text-lg">支付表单将在这里显示</p>
                        <p className="text-sm">点击左侧的"开始支付"按钮开始</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Stripe Checkout */}
          <TabsContent className="space-y-8" value="checkout">
            <div
              className={`
              grid gap-8
              md:grid-cols-2
            `}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Stripe Checkout 配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount-checkout">支付金额 (USD)</Label>
                    <Input
                      id="amount-checkout"
                      min="0.50"
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0.5) {
                          setAmount(value);
                        } else if (e.target.value === "") {
                          setAmount(0.5);
                        }
                      }}
                      step="0.01"
                      type="number"
                      value={amount}
                    />
                  </div>
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      disabled={amount < 0.5}
                      onClick={handleCheckoutPayment}
                    >
                      跳转到 Checkout ${amount.toFixed(2)}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="text-sm text-green-800">
                      <strong>特点:</strong> Stripe
                      托管的预构建结账页面，快速集成，转化率经过优化。
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex h-64 items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2 text-lg">
                      点击按钮将跳转到 Stripe Checkout
                    </p>
                    <p className="text-sm">
                      这是一个由 Stripe 托管的安全支付页面
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Link */}
          <TabsContent className="space-y-8" value="payment-link">
            <div
              className={`
              grid gap-8
              md:grid-cols-2
            `}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payment Link 配置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount-link">支付金额 (USD)</Label>
                    <Input
                      id="amount-link"
                      min="0.50"
                      onChange={(e) => {
                        const value = Number.parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0.5) {
                          setAmount(value);
                        } else if (e.target.value === "") {
                          setAmount(0.5);
                        }
                      }}
                      step="0.01"
                      type="number"
                      value={amount}
                    />
                  </div>
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      disabled={amount < 0.5}
                      onClick={createPaymentLink}
                    >
                      打开 Payment Link ${amount.toFixed(2)}
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3">
                    <p className="text-sm text-purple-800">
                      <strong>特点:</strong> 无需代码的支付链接，通过 Stripe
                      Dashboard 创建，适合简单的支付场景。
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex h-64 items-center justify-center">
                  <div className="text-center text-gray-500">
                    <p className="mb-2 text-lg">点击按钮将打开 Payment Link</p>
                    <p className="text-sm">这是一个预设的 Stripe 支付链接</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 支付状态显示 */}
        {paymentStatus !== "idle" && (
          <div
            className={`
              mt-8 flex items-center space-x-2 rounded-lg p-4
              ${
                paymentStatus === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }
            `}
          >
            {paymentStatus === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 说明信息 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>测试信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`
                grid gap-6
                md:grid-cols-2
              `}
            >
              <div>
                <h3 className="mb-2 font-semibold">测试卡号</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <code>4242 4242 4242 4242</code> - 成功支付
                  </p>
                  <p>
                    <code>4000 0000 0000 0002</code> - 卡被拒绝
                  </p>
                  <p>
                    <code>4000 0000 0000 9995</code> - 资金不足
                  </p>
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">其他测试数据</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>过期日期: 任何未来日期</p>
                  <p>CVC: 任何3位数字</p>
                  <p>邮编: 任何5位数字</p>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                <strong>注意:</strong> 这是一个演示环境，不会产生真实的费用。
                请使用上述测试卡号进行测试。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
