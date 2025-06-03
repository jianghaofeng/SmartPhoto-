---
description: Next.js 15特定开发规则和最佳实践
globs: ["src/app/**/*.ts", "src/app/**/*.tsx"]
alwaysApply: true
---

# Next.js 15开发规则

## App Router规范

### 文件结构

```
src/app/
├── layout.tsx          # 根布局
├── page.tsx           # 首页
├── loading.tsx        # 加载UI
├── error.tsx          # 错误UI
├── not-found.tsx      # 404页面
├── api/               # API路由
│   └── route.ts
├── dashboard/         # 嵌套路由
│   ├── layout.tsx
│   └── page.tsx
└── [dynamic]/         # 动态路由
    └── page.tsx
```

### 页面组件规范

1. **服务器组件优先**:

   ```typescript
   // 默认为服务器组件，无需'use server'
   export default async function Page() {
     const data = await fetchData();
     return <div>{data}</div>;
   }
   ```

2. **客户端组件标记**:

   ```typescript
   'use client';
   
   import { useState } from 'react';
   
   export default function ClientComponent() {
     const [state, setState] = useState();
     return <div>Interactive content</div>;
   }
   ```

3. **混合使用模式**:

   ```typescript
   // 服务器组件
   import ClientComponent from './client-component';
   
   export default async function Page() {
     const data = await fetchServerData();
     return (
       <div>
         <h1>Server rendered: {data.title}</h1>
         <ClientComponent initialData={data} />
       </div>
     );
   }
   ```

## API路由规范

### 路由处理器

1. **HTTP方法处理**:

   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   
   export async function GET(request: NextRequest) {
     return NextResponse.json({ message: 'Hello' });
   }
   
   export async function POST(request: NextRequest) {
     const body = await request.json();
     return NextResponse.json({ received: body });
   }
   ```

2. **动态路由参数** (Next.js 15重要变更):

   ```typescript
   // params现在是Promise类型
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params; // 必须await
     return NextResponse.json({ id });
   }
   ```

3. **搜索参数处理**:

   ```typescript
   export async function GET(request: NextRequest) {
     const searchParams = request.nextUrl.searchParams;
     const query = searchParams.get('q');
     return NextResponse.json({ query });
   }
   ```

### 错误处理

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 业务逻辑
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
```

## 数据获取

### 服务器端数据获取

1. **async/await模式**:

   ```typescript
   async function getData() {
     const res = await fetch('https://api.example.com/data', {
       cache: 'force-cache', // 静态生成
     });
     
     if (!res.ok) {
       throw new Error('Failed to fetch data');
     }
     
     return res.json();
   }
   
   export default async function Page() {
     const data = await getData();
     return <div>{data.title}</div>;
   }
   ```

2. **缓存策略**:

   ```typescript
   // 静态生成 (默认)
   fetch(url, { cache: 'force-cache' });
   
   // 服务器端渲染
   fetch(url, { cache: 'no-store' });
   
   // 增量静态再生
   fetch(url, { next: { revalidate: 3600 } });
   ```

### 客户端数据获取

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function ClientData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading...</div>;
  return <div>{data?.title}</div>;
}
```

## 路由和导航

### 编程式导航

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function NavigationExample() {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/dashboard');
    // router.replace('/dashboard'); // 替换当前历史记录
    // router.back(); // 返回上一页
    // router.forward(); // 前进
  };
  
  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

### Link组件

```typescript
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/profile" prefetch={false}>
        Profile
      </Link>
    </nav>
  );
}
```

## 中间件

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 认证检查
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*']
};
```

## 元数据API

### 静态元数据

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartPhoto - AI图像编辑',
  description: '专业的AI图像编辑和处理平台',
  keywords: ['AI', '图像编辑', '图片处理'],
  openGraph: {
    title: 'SmartPhoto',
    description: 'AI图像编辑平台',
    images: ['/og-image.jpg'],
  },
};
```

### 动态元数据

```typescript
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchData(id);
  
  return {
    title: data.title,
    description: data.description,
  };
}
```

## 性能优化

### 图片优化

```typescript
import Image from 'next/image';

export default function OptimizedImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={800}
      height={600}
      priority // 首屏图片
      placeholder="blur" // 模糊占位符
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### 代码分割

```typescript
import dynamic from 'next/dynamic';

// 动态导入组件
const DynamicComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // 禁用服务器端渲染
});

export default function Page() {
  return (
    <div>
      <h1>Page Content</h1>
      <DynamicComponent />
    </div>
  );
}
```

## 错误处理

### 错误边界

```typescript
// error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### 全局错误处理

```typescript
// global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

## TypeScript集成

### 类型定义

```typescript
// 页面props类型
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 布局props类型
type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

// API路由类型
type RouteContext = {
  params: Promise<{ id: string }>;
};
```

### 严格类型检查

```typescript
// 启用严格模式
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 最佳实践

1. **组件分离**: 服务器组件处理数据获取，客户端组件处理交互
2. **缓存策略**: 合理使用fetch缓存选项
3. **错误处理**: 为每个路由段提供错误边界
4. **性能监控**: 使用Next.js内置的性能指标
5. **SEO优化**: 利用元数据API和结构化数据
6. **安全性**: 在中间件中处理认证和授权

---

遵循这些规则可以充分利用Next.js 15的新特性和性能优化。
