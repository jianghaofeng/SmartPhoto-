---
description: SmartPhoto项目特定规则 - AI图像编辑和处理平台
globs: 
alwaysApply: true
---

# SmartPhoto项目开发规则

## 项目概述

SmartPhoto是一个基于Next.js 15的AI图像编辑和处理平台，集成了Stripe支付、AWS S3存储、通义万象API等服务。

## 技术栈规范

### 核心技术

- **框架**: Next.js 15.3.2 (App Router)
- **运行时**: Bun (优先使用bun命令)
- **语言**: TypeScript 5.8+
- **数据库**: PostgreSQL + Drizzle ORM
- **样式**: Tailwind CSS 4.1+
- **UI组件**: Radix UI + shadcn/ui
- **状态管理**: React Hook Form + Zod验证
- **支付**: Stripe
- **存储**: AWS S3 + UploadThing
- **认证**: Better Auth

### 开发工具

- **包管理**: Bun (不使用npm/yarn)
- **终端**: iTerm2 + Oh My Zsh
- **代码检查**: ESLint + Biome + TypeScript
- **构建**: Next.js + Turbopack

## 代码规范

### API路由规范

1. **参数类型处理**:

   ```typescript
   // Next.js 15中params是Promise类型
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params;
   }
   ```

2. **请求体类型安全**:

   ```typescript
   // 使用类型断言处理request.json()
   const body = await request.json() as { field: string };
   // 或使用Zod schema验证
   const validatedData = schema.parse(await request.json());
   ```

3. **错误处理**:

   ```typescript
   return NextResponse.json(
     { error: "错误信息" },
     { status: 400 }
   );
   ```

### 组件开发规范

1. **文件命名**:
   - 组件文件使用PascalCase: `ImageEditForm.tsx`
   - 页面文件使用kebab-case: `image-edit/page.tsx`
   - 工具函数使用kebab-case: `wanx-image-edit.ts`

2. **组件结构**:

   ```typescript
   // 使用forwardRef和泛型
   interface ComponentProps {
     // props定义
   }
   
   export const Component = forwardRef<HTMLElement, ComponentProps>(
     ({ ...props }, ref) => {
       return <div ref={ref} {...props} />;
     }
   );
   ```

3. **表单处理**:
   - 使用React Hook Form + Zod
   - 表单验证schema放在单独文件
   - 使用shadcn/ui的Form组件

### 数据库规范

1. **Schema组织**:

   ```
   src/db/schema/
   ├── users/
   │   ├── tables.ts
   │   ├── relations.ts
   │   └── types.ts
   ├── image-edits/
   └── payments/
   ```

2. **关系定义**:

   ```typescript
   // 必须同时定义relations和外键
   export const userRelations = relations(userTable, ({ many }) => ({
     uploads: many(uploadsTable),
   }));
   ```

3. **查询模式**:

   ```typescript
   // 使用关系查询
   const result = await db.query.userTable.findMany({
     with: { uploads: true }
   });
   ```

## 业务逻辑规范

### 图像处理流程

1. **任务创建**: POST `/api/image-edits`
2. **状态轮询**: GET `/api/image-edits/[taskId]`
3. **结果保存**: POST `/api/image-edits/results/[resultId]/save`

### 支付集成

1. **支付意图**: `/api/stripe/create-payment-intent`
2. **结账会话**: `/api/stripe/create-checkout-session`
3. **Webhook处理**: `/api/stripe/webhook`

### 文件上传

1. **S3直传**: `/api/s3-upload`
2. **UploadThing**: `/api/uploadthing`
3. **URL上传**: `/api/media/url-upload`

## 安全规范

1. **环境变量**:
   - 敏感信息使用环境变量
   - API密钥不得硬编码
   - 使用.env.example模板

2. **认证检查**:

   ```typescript
   const session = await auth();
   if (!session?.user) {
     return NextResponse.json({ error: "unauthorized" }, { status: 401 });
   }
   ```

3. **输入验证**:
   - 所有用户输入必须验证
   - 使用Zod schema
   - 文件上传限制大小和类型

## 性能优化

1. **图片优化**:
   - 使用Next.js Image组件
   - 支持AVIF/WebP格式
   - 配置远程图片域名

2. **代码分割**:
   - 使用动态导入
   - 页面级别代码分割
   - 组件懒加载

3. **缓存策略**:
   - API响应缓存
   - 静态资源缓存
   - 数据库查询优化

## 国际化

1. **多语言支持**:
   - 中文为主要语言
   - 英文为备选语言
   - 使用locales目录结构

2. **文本处理**:
   - UI文本使用i18n
   - 错误信息本地化
   - 日期时间格式化

## 测试规范

1. **测试文件位置**: `.tests/`目录
2. **测试类型**:
   - 环境变量测试
   - 支付功能测试
   - API端点测试

## 部署规范

1. **构建命令**: `bun run build`
2. **开发服务器**: `bun run dev`
3. **数据库**: `bun run db:push`
4. **代码检查**: `bun run check`

## 错误处理

1. **API错误**:

   ```typescript
   try {
     // 业务逻辑
   } catch (error) {
     console.error("错误详情:", error);
     return NextResponse.json(
       { error: "操作失败" },
       { status: 500 }
     );
   }
   ```

2. **前端错误**:
   - 使用Error Boundary
   - Toast通知用户
   - 优雅降级处理

## 代码审查要点

1. **类型安全**: 避免any类型，使用严格的TypeScript
2. **性能**: 避免不必要的重渲染和API调用
3. **安全**: 检查认证和授权逻辑
4. **用户体验**: 加载状态、错误提示、响应式设计
5. **代码质量**: 遵循ESLint和Biome规则

---

遵循这些规则可以确保SmartPhoto项目的代码质量、安全性和可维护性。
