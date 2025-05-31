import { cookies, headers } from "next/headers";

import {
  defaultLanguage,
  type SupportedLanguage,
  supportedLanguages,
} from "./i18n";

/**
 * 从请求头中获取用户偏好语言（服务端）
 */
export async function getServerLanguage(): Promise<SupportedLanguage> {
  try {
    // 首先尝试从 cookie 中获取
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get("preferred-language")?.value;

    if (
      cookieLang &&
      supportedLanguages.includes(cookieLang as SupportedLanguage)
    ) {
      return cookieLang as SupportedLanguage;
    }

    // 如果 cookie 中没有，从 Accept-Language 请求头中检测
    const headersList = await headers();
    const acceptLanguage = headersList.get("Accept-Language");

    if (acceptLanguage) {
      // 解析 Accept-Language 头
      const preferredLanguages = acceptLanguage
        .split(",")
        .map((lang: string) => lang.split(";")[0].trim().toLowerCase());

      // 查找支持的语言
      for (const lang of preferredLanguages) {
        // 精确匹配
        if (supportedLanguages.includes(lang as SupportedLanguage)) {
          return lang as SupportedLanguage;
        }

        // 语言前缀匹配（例如 zh-CN -> zh）
        const langPrefix = lang.split("-")[0];
        if (supportedLanguages.includes(langPrefix as SupportedLanguage)) {
          return langPrefix as SupportedLanguage;
        }
      }
    }
  } catch (error) {
    console.warn("Failed to detect server language:", error);
  }

  return defaultLanguage;
}

/**
 * 设置语言偏好 cookie（服务端）
 */
export async function setLanguageCookie(language: SupportedLanguage) {
  if (!supportedLanguages.includes(language)) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const cookieStore = await cookies();
  cookieStore.set("preferred-language", language, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
    httpOnly: false, // 允许客户端读取
    path: "/",
    sameSite: "strict",
  });
}
