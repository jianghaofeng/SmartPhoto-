---
description: 数据库操作和API开发规则
globs: ["src/db/**/*.ts", "src/app/api/**/*.ts"]
alwaysApply: true
---

# 数据库和API开发规则

## 数据库设计规范

### Drizzle ORM Schema定义

1. **表结构定义**:

   ```typescript
   import { pgTable, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
   import { createId } from '@paralleldrive/cuid2';
   
   // 基础字段
   const baseFields = {
     id: text('id').primaryKey().$defaultFn(() => createId()),
     createdAt: timestamp('created_at').defaultNow().notNull(),
     updatedAt: timestamp('updated_at').defaultNow().notNull(),
   };
   
   // 用户表
   export const users = pgTable('users', {
     ...baseFields,
     email: text('email').unique().notNull(),
     name: text('name').notNull(),
     avatar: text('avatar'),
     role: text('role', { enum: ['user', 'admin'] }).default('user').notNull(),
     emailVerified: timestamp('email_verified'),
     isActive: boolean('is_active').default(true).notNull(),
   });
   
   // 图片编辑任务表
   export const imageEditTasks = pgTable('image_edit_tasks', {
     ...baseFields,
     userId: text('user_id').references(() => users.id).notNull(),
     originalImageUrl: text('original_image_url').notNull(),
     editedImageUrl: text('edited_image_url'),
     editType: text('edit_type', { 
       enum: ['background-removal', 'enhancement', 'resize', 'filter'] 
     }).notNull(),
     status: text('status', { 
       enum: ['pending', 'processing', 'completed', 'failed'] 
     }).default('pending').notNull(),
     parameters: jsonb('parameters').$type<Record<string, unknown>>(),
     errorMessage: text('error_message'),
     processingTime: integer('processing_time'), // 毫秒
   });
   ```

2. **关系定义**:

   ```typescript
   import { relations } from 'drizzle-orm';
   
   export const usersRelations = relations(users, ({ many }) => ({
     imageEditTasks: many(imageEditTasks),
     uploads: many(uploads),
     payments: many(payments),
   }));
   
   export const imageEditTasksRelations = relations(imageEditTasks, ({ one, many }) => ({
     user: one(users, {
       fields: [imageEditTasks.userId],
       references: [users.id],
     }),
     results: many(imageEditResults),
   }));
   ```

3. **类型推导**:

   ```typescript
   import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
   
   // 选择类型（从数据库读取）
   export type User = InferSelectModel<typeof users>;
   export type ImageEditTask = InferSelectModel<typeof imageEditTasks>;
   
   // 插入类型（写入数据库）
   export type NewUser = InferInsertModel<typeof users>;
   export type NewImageEditTask = InferInsertModel<typeof imageEditTasks>;
   
   // 部分更新类型
   export type UserUpdate = Partial<Omit<NewUser, 'id' | 'createdAt'>>;
   export type TaskUpdate = Partial<Omit<NewImageEditTask, 'id' | 'createdAt'>>;
   ```

### 数据库操作模式

1. **查询操作**:

   ```typescript
   import { db } from '@/db';
   import { users, imageEditTasks } from '@/db/schema';
   import { eq, and, desc, count, sql } from 'drizzle-orm';
   
   // 基础查询
   export async function getUserById(id: string): Promise<User | null> {
     const result = await db
       .select()
       .from(users)
       .where(eq(users.id, id))
       .limit(1);
     
     return result[0] || null;
   }
   
   // 关联查询
   export async function getUserWithTasks(userId: string) {
     return await db
       .select({
         user: users,
         task: imageEditTasks,
       })
       .from(users)
       .leftJoin(imageEditTasks, eq(users.id, imageEditTasks.userId))
       .where(eq(users.id, userId));
   }
   
   // 分页查询
   export async function getTasksPaginated({
     userId,
     page = 1,
     limit = 10,
     status
   }: {
     userId: string;
     page?: number;
     limit?: number;
     status?: string;
   }) {
     const offset = (page - 1) * limit;
     
     const conditions = [eq(imageEditTasks.userId, userId)];
     if (status) {
       conditions.push(eq(imageEditTasks.status, status));
     }
     
     const [tasks, totalCount] = await Promise.all([
       db
         .select()
         .from(imageEditTasks)
         .where(and(...conditions))
         .orderBy(desc(imageEditTasks.createdAt))
         .limit(limit)
         .offset(offset),
       
       db
         .select({ count: count() })
         .from(imageEditTasks)
         .where(and(...conditions))
     ]);
     
     return {
       tasks,
       pagination: {
         page,
         limit,
         total: totalCount[0].count,
         totalPages: Math.ceil(totalCount[0].count / limit)
       }
     };
   }
   ```

2. **写入操作**:

   ```typescript
   // 创建记录
   export async function createImageEditTask(
     data: Omit<NewImageEditTask, 'id' | 'createdAt' | 'updatedAt'>
   ): Promise<ImageEditTask> {
     const result = await db
       .insert(imageEditTasks)
       .values({
         ...data,
         updatedAt: new Date(),
       })
       .returning();
     
     return result[0];
   }
   
   // 更新记录
   export async function updateTaskStatus(
     taskId: string, 
     status: string, 
     additionalData?: Partial<TaskUpdate>
   ): Promise<ImageEditTask | null> {
     const result = await db
       .update(imageEditTasks)
       .set({
         status,
         ...additionalData,
         updatedAt: new Date(),
       })
       .where(eq(imageEditTasks.id, taskId))
       .returning();
     
     return result[0] || null;
   }
   
   // 批量操作
   export async function batchUpdateTasks(
     taskIds: string[], 
     updates: Partial<TaskUpdate>
   ): Promise<void> {
     await db
       .update(imageEditTasks)
       .set({
         ...updates,
         updatedAt: new Date(),
       })
       .where(sql`${imageEditTasks.id} = ANY(${taskIds})`);
   }
   ```

3. **事务处理**:

   ```typescript
   import { db } from '@/db';
   
   export async function createTaskWithResult(
     taskData: Omit<NewImageEditTask, 'id' | 'createdAt' | 'updatedAt'>,
     resultData: Omit<NewImageEditResult, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>
   ) {
     return await db.transaction(async (tx) => {
       // 创建任务
       const task = await tx
         .insert(imageEditTasks)
         .values({
           ...taskData,
           updatedAt: new Date(),
         })
         .returning();
       
       // 创建结果
       const result = await tx
         .insert(imageEditResults)
         .values({
           ...resultData,
           taskId: task[0].id,
           updatedAt: new Date(),
         })
         .returning();
       
       return { task: task[0], result: result[0] };
     });
   }
   ```

## API路由设计

### RESTful API规范

1. **路由结构**:

   ```
   /api/
   ├── auth/
   │   ├── login/route.ts
   │   ├── logout/route.ts
   │   └── register/route.ts
   ├── users/
   │   ├── route.ts                    # GET /api/users, POST /api/users
   │   ├── [id]/route.ts              # GET, PUT, DELETE /api/users/[id]
   │   └── [id]/tasks/route.ts        # GET /api/users/[id]/tasks
   ├── image-edits/
   │   ├── route.ts                   # GET, POST /api/image-edits
   │   ├── [taskId]/route.ts          # GET, PUT, DELETE /api/image-edits/[taskId]
   │   └── [taskId]/results/route.ts  # GET /api/image-edits/[taskId]/results
   └── uploads/
       └── route.ts
   ```

2. **HTTP方法约定**:

   ```typescript
   // GET - 获取资源
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     try {
       const { id } = await params;
       const user = await getUserById(id);
       
       if (!user) {
         return NextResponse.json(
           { error: '用户不存在' },
           { status: 404 }
         );
       }
       
       return NextResponse.json({ data: user });
     } catch (error) {
       console.error('获取用户失败:', error);
       return NextResponse.json(
         { error: '服务器内部错误' },
         { status: 500 }
       );
     }
   }
   
   // POST - 创建资源
   export async function POST(request: NextRequest) {
     try {
       const body = await request.json() as unknown;
       const validatedData = createUserSchema.parse(body);
       
       const user = await createUser(validatedData);
       
       return NextResponse.json(
         { data: user, message: '用户创建成功' },
         { status: 201 }
       );
     } catch (error) {
       if (error instanceof z.ZodError) {
         return NextResponse.json(
           { error: '数据验证失败', details: error.errors },
           { status: 400 }
         );
       }
       
       console.error('创建用户失败:', error);
       return NextResponse.json(
         { error: '服务器内部错误' },
         { status: 500 }
       );
     }
   }
   
   // PUT - 更新资源
   export async function PUT(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     try {
       const { id } = await params;
       const body = await request.json() as unknown;
       const validatedData = updateUserSchema.parse(body);
       
       const user = await updateUser(id, validatedData);
       
       if (!user) {
         return NextResponse.json(
           { error: '用户不存在' },
           { status: 404 }
         );
       }
       
       return NextResponse.json({ data: user, message: '用户更新成功' });
     } catch (error) {
       console.error('更新用户失败:', error);
       return NextResponse.json(
         { error: '服务器内部错误' },
         { status: 500 }
       );
     }
   }
   
   // DELETE - 删除资源
   export async function DELETE(
     request: NextRequest,
     { params }: { params: Promise<{ id: string }> }
   ) {
     try {
       const { id } = await params;
       const success = await deleteUser(id);
       
       if (!success) {
         return NextResponse.json(
           { error: '用户不存在' },
           { status: 404 }
         );
       }
       
       return NextResponse.json({ message: '用户删除成功' });
     } catch (error) {
       console.error('删除用户失败:', error);
       return NextResponse.json(
         { error: '服务器内部错误' },
         { status: 500 }
       );
     }
   }
   ```

### 数据验证

1. **Zod Schema定义**:

   ```typescript
   import { z } from 'zod';
   
   // 用户相关schema
   export const createUserSchema = z.object({
     email: z.string().email('请输入有效的邮箱地址'),
     name: z.string().min(2, '姓名至少2个字符').max(50, '姓名不能超过50个字符'),
     avatar: z.string().url('请提供有效的头像URL').optional(),
     role: z.enum(['user', 'admin']).default('user'),
   });
   
   export const updateUserSchema = createUserSchema.partial();
   
   // 图片编辑任务schema
   export const createTaskSchema = z.object({
     originalImageUrl: z.string().url('请提供有效的图片URL'),
     editType: z.enum(['background-removal', 'enhancement', 'resize', 'filter']),
     parameters: z.record(z.unknown()).optional(),
   });
   
   export const updateTaskSchema = z.object({
     status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
     editedImageUrl: z.string().url().optional(),
     errorMessage: z.string().optional(),
     processingTime: z.number().int().positive().optional(),
   });
   
   // 分页参数schema
   export const paginationSchema = z.object({
     page: z.coerce.number().int().positive().default(1),
     limit: z.coerce.number().int().positive().max(100).default(10),
     sortBy: z.string().optional(),
     sortOrder: z.enum(['asc', 'desc']).default('desc'),
   });
   ```

2. **请求验证中间件**:

   ```typescript
   import { NextRequest } from 'next/server';
   import { z } from 'zod';
   
   export function validateRequest<T extends z.ZodSchema>(
     schema: T,
     handler: (data: z.infer<T>, request: NextRequest) => Promise<Response>
   ) {
     return async (request: NextRequest) => {
       try {
         const body = await request.json() as unknown;
         const validatedData = schema.parse(body);
         return await handler(validatedData, request);
       } catch (error) {
         if (error instanceof z.ZodError) {
           return NextResponse.json(
             { 
               error: '数据验证失败', 
               details: error.errors.map(err => ({
                 field: err.path.join('.'),
                 message: err.message
               }))
             },
             { status: 400 }
           );
         }
         throw error;
       }
     };
   }
   
   // 使用示例
   export const POST = validateRequest(
     createTaskSchema,
     async (data, request) => {
       const task = await createImageEditTask(data);
       return NextResponse.json({ data: task }, { status: 201 });
     }
   );
   ```

### 认证和授权

1. **JWT认证**:

   ```typescript
   import jwt from 'jsonwebtoken';
   import { NextRequest } from 'next/server';
   
   interface JWTPayload {
     userId: string;
     email: string;
     role: string;
   }
   
   export function verifyToken(token: string): JWTPayload | null {
     try {
       const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
       return payload;
     } catch (error) {
       return null;
     }
   }
   
   export function getTokenFromRequest(request: NextRequest): string | null {
     const authHeader = request.headers.get('authorization');
     if (authHeader && authHeader.startsWith('Bearer ')) {
       return authHeader.substring(7);
     }
     
     // 也可以从cookie获取
     return request.cookies.get('token')?.value || null;
   }
   
   export async function requireAuth(request: NextRequest): Promise<JWTPayload> {
     const token = getTokenFromRequest(request);
     
     if (!token) {
       throw new Error('未提供认证令牌');
     }
     
     const payload = verifyToken(token);
     
     if (!payload) {
       throw new Error('无效的认证令牌');
     }
     
     return payload;
   }
   ```

2. **权限检查**:

   ```typescript
   export function requireRole(allowedRoles: string[]) {
     return async (request: NextRequest) => {
       const user = await requireAuth(request);
       
       if (!allowedRoles.includes(user.role)) {
         throw new Error('权限不足');
       }
       
       return user;
     };
   }
   
   export async function requireOwnership(
     request: NextRequest,
     resourceUserId: string
   ): Promise<JWTPayload> {
     const user = await requireAuth(request);
     
     if (user.role !== 'admin' && user.userId !== resourceUserId) {
       throw new Error('无权访问此资源');
     }
     
     return user;
   }
   
   // 使用示例
   export async function GET(
     request: NextRequest,
     { params }: { params: Promise<{ taskId: string }> }
   ) {
     try {
       const { taskId } = await params;
       const task = await getTaskById(taskId);
       
       if (!task) {
         return NextResponse.json(
           { error: '任务不存在' },
           { status: 404 }
         );
       }
       
       // 检查权限
       await requireOwnership(request, task.userId);
       
       return NextResponse.json({ data: task });
     } catch (error) {
       if (error instanceof Error) {
         if (error.message.includes('权限') || error.message.includes('认证')) {
           return NextResponse.json(
             { error: error.message },
             { status: 403 }
           );
         }
       }
       
       console.error('获取任务失败:', error);
       return NextResponse.json(
         { error: '服务器内部错误' },
         { status: 500 }
       );
     }
   }
   ```

### 错误处理

1. **统一错误响应格式**:

   ```typescript
   interface ApiError {
     error: string;
     code?: string;
     details?: unknown;
     timestamp: string;
   }
   
   export function createErrorResponse(
     message: string,
     status: number,
     code?: string,
     details?: unknown
   ): NextResponse {
     const errorResponse: ApiError = {
       error: message,
       code,
       details,
       timestamp: new Date().toISOString(),
     };
     
     return NextResponse.json(errorResponse, { status });
   }
   
   // 常用错误响应
   export const ErrorResponses = {
     badRequest: (message = '请求参数错误', details?: unknown) =>
       createErrorResponse(message, 400, 'BAD_REQUEST', details),
     
     unauthorized: (message = '未授权访问') =>
       createErrorResponse(message, 401, 'UNAUTHORIZED'),
     
     forbidden: (message = '权限不足') =>
       createErrorResponse(message, 403, 'FORBIDDEN'),
     
     notFound: (message = '资源不存在') =>
       createErrorResponse(message, 404, 'NOT_FOUND'),
     
     conflict: (message = '资源冲突') =>
       createErrorResponse(message, 409, 'CONFLICT'),
     
     internalError: (message = '服务器内部错误') =>
       createErrorResponse(message, 500, 'INTERNAL_ERROR'),
   };
   ```

2. **全局错误处理**:

   ```typescript
   export function withErrorHandling(
     handler: (request: NextRequest, context?: any) => Promise<NextResponse>
   ) {
     return async (request: NextRequest, context?: any) => {
       try {
         return await handler(request, context);
       } catch (error) {
         console.error('API错误:', error);
         
         if (error instanceof z.ZodError) {
           return ErrorResponses.badRequest('数据验证失败', error.errors);
         }
         
         if (error instanceof Error) {
           if (error.message.includes('权限')) {
             return ErrorResponses.forbidden(error.message);
           }
           
           if (error.message.includes('认证')) {
             return ErrorResponses.unauthorized(error.message);
           }
           
           if (error.message.includes('不存在')) {
             return ErrorResponses.notFound(error.message);
           }
         }
         
         return ErrorResponses.internalError();
       }
     };
   }
   ```

### 性能优化

1. **数据库连接池**:

   ```typescript
   import { drizzle } from 'drizzle-orm/postgres-js';
   import postgres from 'postgres';
   
   // 连接池配置
   const connectionString = process.env.DATABASE_URL!;
   const client = postgres(connectionString, {
     max: 20, // 最大连接数
     idle_timeout: 20, // 空闲超时（秒）
     connect_timeout: 10, // 连接超时（秒）
   });
   
   export const db = drizzle(client);
   ```

2. **查询优化**:

   ```typescript
   // 使用索引
   export const users = pgTable('users', {
     // ...
     email: text('email').unique().notNull(), // 自动创建索引
   }, (table) => ({
     emailIdx: index('email_idx').on(table.email),
     createdAtIdx: index('created_at_idx').on(table.createdAt),
   }));
   
   // 批量查询
   export async function getUsersByIds(ids: string[]): Promise<User[]> {
     return await db
       .select()
       .from(users)
       .where(sql`${users.id} = ANY(${ids})`);
   }
   
   // 预加载关联数据
   export async function getTasksWithUsers(limit: number = 10) {
     return await db
       .select({
         task: imageEditTasks,
         user: {
           id: users.id,
           name: users.name,
           email: users.email,
         },
       })
       .from(imageEditTasks)
       .innerJoin(users, eq(imageEditTasks.userId, users.id))
       .limit(limit);
   }
   ```

3. **缓存策略**:

   ```typescript
   import { unstable_cache } from 'next/cache';
   
   // 缓存用户数据
   export const getCachedUser = unstable_cache(
     async (id: string) => {
       return await getUserById(id);
     },
     ['user'],
     {
       revalidate: 300, // 5分钟
       tags: ['user'],
     }
   );
   
   // 缓存统计数据
   export const getCachedStats = unstable_cache(
     async () => {
       const [userCount, taskCount] = await Promise.all([
         db.select({ count: count() }).from(users),
         db.select({ count: count() }).from(imageEditTasks),
       ]);
       
       return {
         users: userCount[0].count,
         tasks: taskCount[0].count,
       };
     },
     ['stats'],
     {
       revalidate: 3600, // 1小时
       tags: ['stats'],
     }
   );
   ```

## 最佳实践

1. **数据库设计**:
   - 使用一致的命名约定
   - 合理设计索引
   - 避免N+1查询问题
   - 使用事务保证数据一致性

2. **API设计**:
   - 遵循RESTful原则
   - 统一的错误响应格式
   - 完善的数据验证
   - 适当的HTTP状态码

3. **安全性**:
   - 输入验证和清理
   - SQL注入防护
   - 认证和授权检查
   - 敏感数据加密

4. **性能优化**:
   - 数据库查询优化
   - 适当的缓存策略
   - 连接池管理
   - 分页处理大数据集

5. **监控和日志**:
   - 记录关键操作
   - 性能指标监控
   - 错误追踪
   - 数据库性能监控

---

遵循这些数据库和API开发规则可以构建高性能、安全、可维护的后端服务。
