import { relations } from "drizzle-orm";

import { uploadsTable } from "../uploads/tables";
import { userTable } from "../users/tables";
import { imageEditResultsTable, imageEditTasksTable } from "./tables";

// 图像编辑任务关系
export const imageEditTasksRelations = relations(imageEditTasksTable, ({ many, one }) => ({
  // 原始图片
  originalImage: one(uploadsTable, {
    fields: [imageEditTasksTable.originalImageId],
    references: [uploadsTable.id],
  }),

  // 编辑结果
  results: many(imageEditResultsTable),

  // 任务所属用户
  user: one(userTable, {
    fields: [imageEditTasksTable.userId],
    references: [userTable.id],
  }),
}));

// 图像编辑结果关系
export const imageEditResultsRelations = relations(imageEditResultsTable, ({ one }) => ({
  // 保存的图片（可选）
  savedImage: one(uploadsTable, {
    fields: [imageEditResultsTable.savedImageId],
    references: [uploadsTable.id],
  }),

  // 所属任务
  task: one(imageEditTasksTable, {
    fields: [imageEditResultsTable.taskId],
    references: [imageEditTasksTable.id],
  }),
}));