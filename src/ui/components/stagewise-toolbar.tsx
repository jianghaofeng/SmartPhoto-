"use client";

import { useEffect, useState } from "react";
import { StagewiseToolbar as OriginalStagewiseToolbar } from "@stagewise/toolbar-next";

// 工具栏基本配置
const stagewiseConfig = {
  plugins: [],
};

export function StagewiseToolbar() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 只在客户端和开发环境中设置为已挂载
    if (process.env.NODE_ENV === "development") {
      setIsMounted(true);
    }
  }, []);

  // 仅在客户端挂载后且在开发环境中才渲染工具栏
  if (!isMounted) {
    return null;
  }

  return <OriginalStagewiseToolbar config={stagewiseConfig} />;
}
