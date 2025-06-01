# AWS S3 Integration Guide

本文档介绍如何在 SmartPhoto 项目中配置和使用 AWS S3 文件上传功能。

## 功能特性

- ✅ 直接上传文件到 AWS S3
- ✅ 支持图片和视频文件
- ✅ 文件大小限制（图片 4MB，视频 64MB）
- ✅ 文件类型验证
- ✅ 上传进度显示
- ✅ 预签名 URL 生成
- ✅ 文件删除功能
- ✅ 数据库记录同步

## 环境配置

### 1. AWS 配置

在 `.env.local` 文件中添加以下环境变量：

```bash
# AWS S3 配置
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_S3_BUCKET_URL="https://your-bucket-name.s3.amazonaws.com"
```

### 2. AWS S3 Bucket 设置

1. 登录 [AWS Console](https://console.aws.amazon.com/s3/)
2. 创建新的 S3 Bucket 或使用现有的
3. 配置 Bucket 权限：
   - 允许公共读取访问（如果需要直接访问文件）
   - 配置 CORS 策略

#### CORS 配置示例

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 3. IAM 用户权限

为 AWS 用户配置以下 S3 权限：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

## 使用方法

### 1. 在上传页面使用

访问 `/dashboard/uploads` 页面，你会看到两个上传选项：

- **UploadThing 上传**：原有的上传方式
- **AWS S3 上传**：新增的 S3 上传功能

### 2. 编程方式使用

#### 上传文件到 S3

```typescript
import { uploadToS3 } from '~/lib/s3';

const file = new File([...], 'example.jpg', { type: 'image/jpeg' });
const result = await uploadToS3(file, 'uploads/');
console.log('Upload result:', result);
```

#### 生成预签名 URL

```typescript
import { getPresignedUrl } from '~/lib/s3';

const url = await getPresignedUrl('uploads/example.jpg');
console.log('Presigned URL:', url);
```

#### 删除 S3 文件

```typescript
import { deleteFromS3 } from '~/lib/s3';

await deleteFromS3('uploads/example.jpg');
```

### 3. API 端点

#### POST /api/s3-upload

上传文件到 S3 并保存记录到数据库。

**请求格式：** `multipart/form-data`

**参数：**

- `file`: 要上传的文件

**响应：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "key": "uploads/1234567890_example.jpg",
    "url": "https://bucket.s3.amazonaws.com/uploads/1234567890_example.jpg",
    "size": 1024000,
    "type": "image/jpeg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 文件结构

```
src/
├── lib/
│   └── s3.ts                    # S3 工具函数
├── app/
│   └── api/
│       └── s3-upload/
│           └── route.ts          # S3 上传 API 路由
└── ui/
    └── components/
        └── s3-upload-button.tsx  # S3 上传按钮组件
```

## 文件限制

- **图片文件**：最大 4MB
- **视频文件**：最大 64MB
- **支持的图片格式**：JPEG, PNG, GIF, WebP
- **支持的视频格式**：MP4, WebM, MOV

## 故障排除

### 常见问题

1. **上传失败 - 权限错误**
   - 检查 AWS 凭证是否正确
   - 确认 IAM 用户有足够的 S3 权限

2. **CORS 错误**
   - 检查 S3 Bucket 的 CORS 配置
   - 确认允许的源域名包含你的应用域名

3. **文件无法访问**
   - 检查 Bucket 的公共访问设置
   - 确认文件的 ACL 权限

### 调试技巧

1. 检查浏览器控制台的错误信息
2. 查看服务器日志
3. 使用 AWS CLI 测试 S3 连接：

   ```bash
   aws s3 ls s3://your-bucket-name
   ```

## 安全注意事项

1. **环境变量安全**：
   - 不要将 AWS 凭证提交到版本控制
   - 使用 `.env.local` 文件存储敏感信息

2. **文件验证**：
   - 始终验证文件类型和大小
   - 对用户上传的文件进行安全扫描

3. **访问控制**：
   - 根据需要配置 Bucket 权限
   - 考虑使用预签名 URL 控制文件访问

## 性能优化

1. **CDN 集成**：考虑使用 CloudFront 加速文件访问
2. **多部分上传**：对于大文件，可以实现多部分上传
3. **缓存策略**：为静态文件设置适当的缓存头

## 扩展功能

未来可以考虑添加的功能：

- [ ] 图片压缩和优化
- [ ] 视频转码
- [ ] 文件版本管理
- [ ] 批量上传
- [ ] 上传队列管理
- [ ] 文件预览功能
