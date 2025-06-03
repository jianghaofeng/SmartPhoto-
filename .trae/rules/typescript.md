---
description: TypeScript开发规则和类型安全最佳实践
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: true
---

# TypeScript开发规则

## 类型定义规范

### 基础类型定义

1. **接口优于类型别名**（对于对象类型）:

   ```typescript
   // ✅ 推荐
   interface User {
     id: string;
     name: string;
     email: string;
   }
   
   // ❌ 避免（对于对象）
   type User = {
     id: string;
     name: string;
     email: string;
   };
   ```

2. **类型别名用于联合类型和基础类型**:

   ```typescript
   // ✅ 推荐
   type Status = 'pending' | 'completed' | 'failed';
   type ID = string | number;
   ```

3. **严格的null检查**:

   ```typescript
   // ✅ 明确处理可能的null/undefined
   function processUser(user: User | null) {
     if (!user) {
       return null;
     }
     return user.name.toUpperCase();
   }
   ```

### API响应类型

```typescript
// 通用API响应类型
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页响应类型
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 具体使用
interface ImageEditResponse extends ApiResponse<{
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}> {}
```

### 数据库模型类型

```typescript
// 基础实体类型
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 用户类型
interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}

// 图片编辑任务类型
interface ImageEditTask extends BaseEntity {
  userId: string;
  originalImageUrl: string;
  editedImageUrl?: string;
  editType: 'background-removal' | 'enhancement' | 'resize';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  parameters: Record<string, unknown>;
}
```

## React组件类型

### 组件Props类型

```typescript
// 基础组件props
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

// 泛型组件props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  loading?: boolean;
}

// 表单组件props
interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}
```

### Hook类型

```typescript
// 自定义Hook返回类型
interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook实现
function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json() as T;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { data, loading, error, refetch };
}
```

## 表单和验证类型

### Zod Schema类型

```typescript
import { z } from 'zod';

// 用户注册schema
const userRegistrationSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少8位字符'),
  name: z.string().min(2, '姓名至少2个字符'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: '密码确认不匹配',
  path: ['confirmPassword']
});

// 推导类型
type UserRegistrationData = z.infer<typeof userRegistrationSchema>;

// 图片编辑参数schema
const imageEditSchema = z.object({
  imageUrl: z.string().url('请提供有效的图片URL'),
  editType: z.enum(['background-removal', 'enhancement', 'resize']),
  parameters: z.record(z.unknown()).optional()
});

type ImageEditData = z.infer<typeof imageEditSchema>;
```

### React Hook Form类型

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface LoginFormData {
  email: string;
  password: string;
}

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });
  
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      await loginUser(data);
    } catch (error) {
      console.error('登录失败:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 表单字段 */}
    </form>
  );
}
```

## 错误处理类型

### 自定义错误类型

```typescript
// 基础错误类型
interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// API错误类型
interface ApiError extends AppError {
  status: number;
  endpoint: string;
}

// 验证错误类型
interface ValidationError extends AppError {
  field: string;
  value: unknown;
}

// 错误处理函数
function handleError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message
    };
  }
  
  if (typeof error === 'string') {
    return {
      code: 'STRING_ERROR',
      message: error
    };
  }
  
  return {
    code: 'UNEXPECTED_ERROR',
    message: '发生了未知错误'
  };
}
```

## 工具类型

### 常用工具类型

```typescript
// 深度可选类型
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 排除null和undefined
type NonNullable<T> = T extends null | undefined ? never : T;

// 提取Promise的返回类型
type Awaited<T> = T extends Promise<infer U> ? U : T;

// 函数参数类型
type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;

// 函数返回类型
type ReturnType<T> = T extends (...args: unknown[]) => infer R ? R : unknown;
```

### 条件类型

```typescript
// 根据条件选择类型
type ApiMethod<T extends 'GET' | 'POST'> = T extends 'GET'
  ? { params?: Record<string, string> }
  : { body: Record<string, unknown> };

// 使用示例
function apiCall<T extends 'GET' | 'POST'>(
  method: T,
  url: string,
  options: ApiMethod<T>
) {
  // 实现
}

// 类型安全的调用
apiCall('GET', '/users', { params: { page: '1' } }); // ✅
apiCall('POST', '/users', { body: { name: 'John' } }); // ✅
// apiCall('GET', '/users', { body: {} }); // ❌ 类型错误
```

## 模块声明

### 环境变量类型

```typescript
// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_S3_BUCKET: string;
  }
}
```

### 第三方库类型扩展

```typescript
// types/next-auth.d.ts
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'user' | 'admin';
    };
  }
  
  interface User {
    id: string;
    role: 'user' | 'admin';
  }
}
```

## 性能优化类型

### 懒加载类型

```typescript
// 动态导入类型
type LazyComponent<T = {}> = React.LazyExoticComponent<React.ComponentType<T>>;

// 懒加载Hook
function useLazyComponent<T = {}>(importFn: () => Promise<{ default: React.ComponentType<T> }>) {
  return React.lazy(importFn);
}
```

### 缓存类型

```typescript
// 缓存配置类型
interface CacheConfig {
  ttl: number; // 生存时间（秒）
  maxSize: number; // 最大缓存大小
  strategy: 'lru' | 'fifo'; // 缓存策略
}

// 缓存项类型
interface CacheItem<T> {
  value: T;
  timestamp: number;
  ttl: number;
}
```

## 最佳实践

### 1. 严格的类型检查

```typescript
// tsconfig.json配置
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true
  }
}
```

### 2. 类型守卫

```typescript
// 类型守卫函数
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj
  );
}

// 使用类型守卫
function processUserData(data: unknown) {
  if (isUser(data)) {
    // 这里data的类型是User
    console.log(data.email);
  }
}
```

### 3. 断言函数

```typescript
// 断言函数
function assertIsNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('Expected number');
  }
}

// 使用断言
function processNumber(input: unknown) {
  assertIsNumber(input);
  // 这里input的类型是number
  return input * 2;
}
```

### 4. 品牌类型

```typescript
// 品牌类型用于区分相同基础类型
type UserId = string & { readonly brand: unique symbol };
type ProductId = string & { readonly brand: unique symbol };

// 工厂函数
function createUserId(id: string): UserId {
  return id as UserId;
}

function createProductId(id: string): ProductId {
  return id as ProductId;
}

// 类型安全的函数
function getUser(id: UserId): Promise<User> {
  // 实现
}

// 使用
const userId = createUserId('user-123');
const productId = createProductId('product-456');

getUser(userId); // ✅
// getUser(productId); // ❌ 类型错误
```

---

遵循这些TypeScript规则可以提高代码的类型安全性、可维护性和开发体验。
