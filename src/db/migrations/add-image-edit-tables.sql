-- 创建图像编辑功能枚举类型
CREATE TYPE "image_edit_function" AS ENUM (
  'description_edit',
  'stylization_all',
  'stylization_local',
  'description_edit_with_mask',
  'object_removal',
  'background_replacement'
);

-- 创建任务状态枚举类型
CREATE TYPE "task_status" AS ENUM (
  'pending',
  'running',
  'succeeded',
  'failed'
);

-- 创建图像编辑任务表
CREATE TABLE "image_edit_tasks" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "original_image_id" varchar(255) NOT NULL,
  "edit_function" "image_edit_function" NOT NULL,
  "prompt" text NOT NULL,
  "mask_image_url" text,
  "strength" real DEFAULT 0.5,
  "image_count" integer DEFAULT 1,
  "wanx_task_id" varchar(255),
  "status" "task_status" DEFAULT 'pending' NOT NULL,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- 创建图像编辑结果表
CREATE TABLE "image_edit_results" (
  "id" varchar(255) PRIMARY KEY NOT NULL,
  "task_id" varchar(255) NOT NULL,
  "result_image_url" text NOT NULL,
  "local_image_id" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- 添加外键约束
ALTER TABLE "image_edit_tasks" ADD CONSTRAINT "image_edit_tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "image_edit_tasks" ADD CONSTRAINT "image_edit_tasks_original_image_id_uploads_id_fk" FOREIGN KEY ("original_image_id") REFERENCES "uploads"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "image_edit_results" ADD CONSTRAINT "image_edit_results_task_id_image_edit_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "image_edit_tasks"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "image_edit_results" ADD CONSTRAINT "image_edit_results_local_image_id_uploads_id_fk" FOREIGN KEY ("local_image_id") REFERENCES "uploads"("id") ON DELETE set null ON UPDATE no action;

-- 创建索引以提高查询性能
CREATE INDEX "image_edit_tasks_user_id_idx" ON "image_edit_tasks" ("user_id");
CREATE INDEX "image_edit_tasks_status_idx" ON "image_edit_tasks" ("status");
CREATE INDEX "image_edit_tasks_created_at_idx" ON "image_edit_tasks" ("created_at");
CREATE INDEX "image_edit_results_task_id_idx" ON "image_edit_results" ("task_id");