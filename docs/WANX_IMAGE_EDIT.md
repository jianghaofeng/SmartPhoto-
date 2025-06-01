# 通义万象图像编辑功能

本项目集成了阿里云通义万象（Wanx）的图像编辑API，提供强大的AI图像编辑能力。

## 功能特性

### 支持的编辑功能

1. **描述编辑** (`description_edit`)
   - 根据文字描述修改图像内容
   - 例如："将天空改为夜空"

2. **全图风格化** (`stylization_all`)
   - 改变整张图片的艺术风格
   - 例如："转换为油画风格"

3. **局部风格化** (`stylization_local`)
   - 改变图片局部区域的风格
   - 例如："将建筑物改为卡通风格"

4. **蒙版编辑** (`description_edit_with_mask`)
   - 使用蒙版精确编辑指定区域
   - 需要提供蒙版图片URL

5. **物体移除** (`object_removal`)
   - 移除图片中的指定物体
   - 例如："移除图片中的汽车"

6. **背景替换** (`background_replacement`)
   - 替换图片背景
   - 例如："将背景替换为海滩"

## 环境配置

### 1. 获取API密钥

1. 访问 [阿里云DashScope控制台](https://dashscope.aliyun.com/)
2. 注册并登录账号
3. 创建API密钥
4. 复制API密钥到环境变量

### 2. 环境变量配置

在 `.env` 文件中添加以下配置：

```bash
# 通义万象 API 配置
WANX_API_KEY="sk-your-api-key-here"
WANX_BASE_URL="https://dashscope.aliyuncs.com"  # 可选，默认值
```

## 数据库结构

### 图像编辑任务表 (`image_edit_tasks`)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(255) | 任务唯一标识 |
| user_id | varchar(255) | 用户ID |
| original_image_id | varchar(255) | 原始图片ID |
| edit_function | enum | 编辑功能类型 |
| prompt | text | 编辑提示词 |
| mask_image_url | text | 蒙版图片URL（可选） |
| strength | real | 编辑强度 (0.1-1.0) |
| image_count | integer | 生成图片数量 (1-4) |
| wanx_task_id | varchar(255) | 通义万象任务ID |
| status | enum | 任务状态 |
| error_message | text | 错误信息 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 编辑结果表 (`image_edit_results`)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(255) | 结果唯一标识 |
| task_id | varchar(255) | 关联任务ID |
| result_image_url | text | 结果图片URL |
| local_image_id | varchar(255) | 本地保存的图片ID |
| created_at | timestamp | 创建时间 |

## API 接口

### 1. 创建编辑任务

```http
POST /api/image-edits
Content-Type: application/json

{
  "originalImageId": "image_123",
  "editFunction": "description_edit",
  "prompt": "将天空改为夜空，添加星星",
  "strength": 0.8,
  "imageCount": 2
}
```

### 2. 获取任务列表

```http
GET /api/image-edits?page=1&limit=10
```

### 3. 查询任务状态

```http
GET /api/image-edits/{taskId}
```

### 4. 删除任务

```http
DELETE /api/image-edits/{taskId}
```

### 5. 保存结果到本地

```http
POST /api/image-edits/results/{resultId}/save
```

## 使用流程

### 1. 前端使用

1. 访问 `/dashboard/image-edit` 页面
2. 选择要编辑的图片（通过URL或上传）
3. 选择编辑功能和参数
4. 输入编辑提示词
5. 提交编辑任务
6. 在任务列表中查看进度
7. 编辑完成后查看和保存结果

### 2. 编程使用

```typescript
import { WanxImageEditService } from '~/lib/wanx-image-edit';
import { createImageEditTask } from '~/api/image-edits/service';

// 创建编辑任务
const task = await createImageEditTask({
  userId: 'user_123',
  originalImageId: 'image_456',
  editFunction: 'description_edit',
  prompt: '将背景改为森林',
  strength: 0.7,
  imageCount: 1
});

// 直接使用服务
const service = new WanxImageEditService();
const result = await service.editImage({
  function: 'description_edit',
  prompt: '添加彩虹',
  input: {
    image_url: 'https://example.com/image.jpg'
  }
});
```

## 注意事项

### 1. API限制

- 图片大小：建议不超过10MB
- 图片格式：支持 JPEG、PNG、WebP
- 提示词长度：最大800字符
- 生成数量：1-4张图片
- 编辑强度：0.1-1.0

### 2. 费用说明

- 通义万象按调用次数计费
- 不同功能价格可能不同
- 建议查看[官方定价](https://help.aliyun.com/zh/model-studio/product-overview/billing-overview)

### 3. 性能优化

- 图像编辑为异步处理，通常需要10-60秒
- 系统会自动轮询任务状态
- 建议设置合理的超时时间

### 4. 错误处理

- API调用失败会记录错误信息
- 支持任务重试机制
- 提供详细的错误日志

## 故障排除

### 常见问题

1. **API密钥无效**
   - 检查 `WANX_API_KEY` 是否正确配置
   - 确认API密钥是否有效且有足够余额

2. **任务一直处于pending状态**
   - 检查网络连接
   - 确认API服务是否正常
   - 查看错误日志

3. **图片无法访问**
   - 确认图片URL可以公开访问
   - 检查图片格式和大小是否符合要求

4. **编辑效果不理想**
   - 调整编辑强度参数
   - 优化提示词描述
   - 尝试不同的编辑功能

## 开发指南

### 添加新的编辑功能

1. 在 `src/db/schema/image-edits/tables.ts` 中添加新的枚举值
2. 更新 `src/lib/wanx-image-edit.ts` 中的接口定义
3. 在前端组件中添加新功能选项
4. 运行数据库迁移

### 自定义配置

可以通过环境变量自定义以下配置：

- `WANX_BASE_URL`: API基础URL
- `WANX_TIMEOUT`: 请求超时时间（毫秒）
- `WANX_MAX_RETRIES`: 最大重试次数

## 相关链接

- [通义万象官方文档](https://help.aliyun.com/zh/model-studio/wanx-image-edit-api-reference)
- [DashScope控制台](https://dashscope.aliyun.com/)
- [API定价说明](https://help.aliyun.com/zh/model-studio/product-overview/billing-overview)
