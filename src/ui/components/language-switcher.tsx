"use client";

import { CheckIcon, ChevronDownIcon, GlobeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { type SupportedLanguage, supportedLanguages } from "~/lib/i18n";
import {
  getLanguageDisplayName,
  languageNames,
  setClientLanguage,
} from "~/lib/language-utils";
import { Button } from "~/ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/ui/primitives/dropdown-menu";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(
    i18n.language as SupportedLanguage,
  );
  const [isClient, setIsClient] = useState(false);

  // 处理客户端渲染
  useEffect(() => {
    setIsClient(true);
    setCurrentLanguage(i18n.language as SupportedLanguage);
  }, [i18n.language]);

  // 语言切换处理
  const handleLanguageChange = (language: SupportedLanguage) => {
    i18n.changeLanguage(language);
    setClientLanguage(language);
    setCurrentLanguage(language);
  };

  // 服务端渲染时不显示语言切换器
  if (!isClient) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-8 gap-1 px-2" size="sm" variant="ghost">
          <GlobeIcon className="h-4 w-4" />
          <span
            className={`
              hidden
              sm:inline-block
            `}
          >
            {getLanguageDisplayName(currentLanguage)}
          </span>
          <ChevronDownIcon className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang: SupportedLanguage) => (
          <DropdownMenuItem
            className="flex items-center justify-between gap-2"
            key={lang}
            onClick={() => handleLanguageChange(lang)}
          >
            <span>{languageNames[lang].native}</span>
            <span className="text-xs text-muted-foreground">
              ({languageNames[lang].english})
            </span>
            {currentLanguage === lang && <CheckIcon className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
