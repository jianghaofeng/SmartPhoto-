"use client";

import { useTranslation } from "react-i18next";

export default function I18nTest() {
  const { i18n, t } = useTranslation(["common", "navigation", "auth"]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="text-xl font-bold">
        {t("i18n_test", { defaultValue: "i18n Test", ns: "common" })}
      </div>

      <div>
        <p className="text-sm text-muted-foreground">
          当前语言: {i18n.language}
        </p>
      </div>

      <div
        className={`
          grid grid-cols-1 gap-4
          sm:grid-cols-2
          md:grid-cols-3
        `}
      >
        <div className="rounded-md border p-3">
          <h3 className="mb-2 font-medium">导航 (navigation)</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <span className="text-muted-foreground">首页:</span>{" "}
              {t("home", { ns: "navigation" })}
            </li>
            <li>
              <span className="text-muted-foreground">产品:</span>{" "}
              {t("products", { ns: "navigation" })}
            </li>
            <li>
              <span className="text-muted-foreground">设置:</span>{" "}
              {t("settings", { ns: "navigation" })}
            </li>
          </ul>
        </div>

        <div className="rounded-md border p-3">
          <h3 className="mb-2 font-medium">认证 (auth)</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <span className="text-muted-foreground">登录:</span>{" "}
              {t("login", { ns: "auth" })}
            </li>
            <li>
              <span className="text-muted-foreground">注册:</span>{" "}
              {t("register", { ns: "auth" })}
            </li>
            <li>
              <span className="text-muted-foreground">忘记密码:</span>{" "}
              {t("forgotPassword", { ns: "auth" })}
            </li>
          </ul>
        </div>

        <div className="rounded-md border p-3">
          <h3 className="mb-2 font-medium">语言名称测试</h3>
          <button
            className={`
              mb-2 rounded-md bg-primary px-3 py-1 text-sm
              text-primary-foreground
            `}
            onClick={() => i18n.changeLanguage("en")}
            type="button"
          >
            切换到英文
          </button>
          <button
            className={`
              ml-2 rounded-md bg-primary px-3 py-1 text-sm
              text-primary-foreground
            `}
            onClick={() => i18n.changeLanguage("zh")}
            type="button"
          >
            切换到中文
          </button>
        </div>
      </div>
    </div>
  );
}
