"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

import { isStripeConfigured, stripePromise } from "~/lib/stripe";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

interface PaymentFormProps {
  amount: number;
  clientSecret: string;
  onError?: (error: string) => void;
  onSuccess?: () => void;
}

// 支付容器组件，处理clientSecret的获取
interface StripePaymentContainerProps {
  amount: number;
  onError?: (error: string) => void;
  onSuccess?: () => void;
  productId?: string;
}

export function StripePaymentContainer({
  amount,
  onError,
  onSuccess,
  productId,
}: StripePaymentContainerProps) {
  const [clientSecret, setClientSecret] = useState<null | string>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // 检查stripe是否已配置
  if (!isStripeConfigured()) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center text-yellow-600">
            <div className="mb-4">
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                className="mx-auto mb-2 h-12 w-12"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold">Stripe 未配置</h3>
            <p className="mb-4 text-sm">请在环境变量中配置 Stripe 密钥</p>
            <div className="space-y-1 text-xs text-gray-600">
              <p>需要设置:</p>
              <p>• NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</p>
              <p>• STRIPE_SECRET_KEY</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const createPaymentIntent = async () => {
    if (!amount || amount < 0.5) {
      onError?.("支付金额必须大于等于 $0.50");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        body: JSON.stringify({
          amount,
          productId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "创建支付失败");
      }

      const data = (await response.json()) as { clientSecret: string };
      setClientSecret(data.clientSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "创建支付失败";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    createPaymentIntent();
  }, [amount, productId]);

  if (isLoading) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">准备支付...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="mb-4 text-red-600">{error}</p>
            <Button onClick={createPaymentIntent} variant="outline">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <StripePaymentForm
      amount={amount}
      clientSecret={clientSecret}
      onError={onError}
      onSuccess={onSuccess}
    />
  );
}

// 主要的Stripe支付表单组件
export function StripePaymentForm({
  amount,
  clientSecret,
  onError,
  onSuccess,
}: PaymentFormProps) {
  const options = {
    appearance: {
      theme: "stripe" as const,
      variables: {
        borderRadius: "6px",
        colorBackground: "#ffffff",
        colorDanger: "#df1b41",
        colorPrimary: "#0570de",
        colorText: "#30313d",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
      },
    },
    clientSecret,
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm amount={amount} onError={onError} onSuccess={onSuccess} />
    </Elements>
  );
}

// 支付表单内部组件
function CheckoutForm({
  amount,
  onError,
  onSuccess,
}: Omit<PaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<null | string>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/billing?success=true`,
        },
        elements,
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "支付失败");
          onError?.(error.message || "支付失败");
        } else {
          setMessage("发生意外错误");
          onError?.("发生意外错误");
        }
      } else {
        // 支付成功会重定向到return_url
        onSuccess?.();
      }
    } catch (err) {
      setMessage("支付处理失败");
      onError?.("支付处理失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>完成支付</CardTitle>
        <p className="text-sm text-muted-foreground">
          金额: ${(amount / 100).toFixed(2)}
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />

          {message && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {message}
            </div>
          )}

          <Button
            className="w-full"
            disabled={isLoading || !stripe || !elements}
            type="submit"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                处理中...
              </>
            ) : (
              `支付 $${(amount / 100).toFixed(2)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
