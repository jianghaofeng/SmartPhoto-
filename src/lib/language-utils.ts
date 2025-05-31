import {
  defaultLanguage,
  type SupportedLanguage,
  supportedLanguages,
} from "./i18n";

/**
 * 获取客户端语言偏好
 */
export function getClientLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return defaultLanguage;
  }

  try {
    // 首先尝试从 localStorage 获取
    const stored = window.localStorage.getItem("preferred-language");
    if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }

    // 然后尝试从 cookie 获取
    const cookieLang = document.cookie
      .split(";")
      .find((row) => row.trim().startsWith("preferred-language="))
      ?.split("=")[1];

    if (
      cookieLang &&
      supportedLanguages.includes(cookieLang as SupportedLanguage)
    ) {
      return cookieLang as SupportedLanguage;
    }

    // 最后检测浏览器语言
    const browserLang = navigator.language.toLowerCase();
    if (supportedLanguages.includes(browserLang as SupportedLanguage)) {
      return browserLang as SupportedLanguage;
    }

    // 语言前缀匹配
    const langPrefix = browserLang.split("-")[0];
    if (supportedLanguages.includes(langPrefix as SupportedLanguage)) {
      return langPrefix as SupportedLanguage;
    }
  } catch (error) {
    console.warn("Failed to detect client language:", error);
  }

  return defaultLanguage;
}

/**
 * 设置客户端语言偏好
 */
export function setClientLanguage(language: SupportedLanguage) {
  if (!supportedLanguages.includes(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  if (typeof window === "undefined") {
    return;
  }

  try {
    // 更新 localStorage
    window.localStorage.setItem("preferred-language", language);

    // 更新 cookie
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    document.cookie = `preferred-language=${language}; path=/; expires=${expires.toUTCString()}; SameSite=Strict`;
  } catch (error) {
    console.warn("Failed to set client language:", error);
  }
}

/**
 * 语言显示名称映射
 */
export const languageNames: Record<
  SupportedLanguage,
  { english: string; native: string }
> = {
  en: { english: "English", native: "English" },
  zh: { english: "Chinese (Simplified)", native: "简体中文" },
};

/**
 * 获取语言的显示名称
 */
export function getLanguageDisplayName(
  language: SupportedLanguage,
  format: "english" | "native" = "native",
): string {
  return languageNames[language]?.[format] || language;
}
