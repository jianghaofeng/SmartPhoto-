"use client";

import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { type PropsWithChildren, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { initReactI18next } from "react-i18next";

import { languageConfig, type SupportedLanguage } from "./i18n";
import { getClientLanguage, setClientLanguage } from "./language-utils";

// 创建 i18next 实例
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    ...languageConfig,
    detection: {
      caches: ["localStorage", "cookie"],
      order: ["localStorage", "cookie", "navigator"],
    },
    interpolation: {
      escapeValue: false,
    },
    lng: getClientLanguage(),
  });

export default function I18nProvider({ children }: PropsWithChildren) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // 确保客户端语言偏好在组件挂载时被设置
    const currentLang = i18next.language as SupportedLanguage;
    setClientLanguage(currentLang);

    // 监听语言变化
    const handleLanguageChanged = (lng: string) => {
      setClientLanguage(lng as SupportedLanguage);
    };

    i18next.on("languageChanged", handleLanguageChanged);

    return () => {
      i18next.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  // 在服务端渲染期间，直接返回子组件
  if (!isClient) {
    return <>{children}</>;
  }

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
