"use client";

import { Download, Eye, Trash2 } from "lucide-react";
import { useState } from "react";

import type { ImageEditResult, ImageEditTask, TaskStatus } from "~/db/schema";

import { Badge } from "~/ui/primitives/badge";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";

interface ImageEditTaskCardProps {
  onDelete: (taskId: string) => Promise<void>;
  onRefreshStatus: (taskId: string) => Promise<void>;
  onSaveResult: (resultId: string) => Promise<void>;
  task: ImageEditTask & {
    originalImage: {
      id: string;
      url: string;
    };
    results: ImageEditResult[];
  };
}

const statusLabels: Record<TaskStatus, string> = {
  failed: "失败",
  pending: "等待中",
  running: "处理中",
  succeeded: "已完成",
};

const statusColors: Record<TaskStatus, string> = {
  failed: "destructive",
  pending: "secondary",
  running: "default",
  succeeded: "default",
};

export function ImageEditTaskCard({
  onDelete,
  onRefreshStatus,
  onSaveResult,
  task,
}: ImageEditTaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingResultId, setSavingResultId] = useState<null | string>(null);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个任务吗？")) return;

    setIsDeleting(true);
    try {
      await onDelete(task.id);
    } catch (error) {
      console.error("删除任务失败:", error);
      alert("删除任务失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStatus(task.id);
    } catch (error) {
      console.error("刷新状态失败:", error);
      alert("刷新状态失败，请重试");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveResult = async (resultId: string) => {
    setSavingResultId(resultId);
    try {
      await onSaveResult(resultId);
    } catch (error) {
      console.error("保存结果失败:", error);
      alert("保存结果失败，请重试");
    } finally {
      setSavingResultId(null);
    }
  };

  return (
    <Card className="w-full border-slate-700 bg-slate-800">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg text-white">图像编辑任务</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={statusColors[task.status] as any}>
                {statusLabels[task.status]}
              </Badge>
              <span className="text-sm text-slate-400">
                任务ID: {task.id.slice(0, 8)}...
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              className={`
                border-slate-600 text-slate-300
                hover:bg-slate-700 hover:text-white
              `}
              disabled={isRefreshing}
              onClick={handleRefresh}
              size="sm"
              variant="outline"
            >
              {isRefreshing ? "刷新中..." : "刷新状态"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 任务信息 */}
        <div
          className={`
            grid grid-cols-1 gap-4
            md:grid-cols-2
          `}
        >
          {/* 原始图片 */}
          <div className="space-y-2">
            <h4 className="font-medium text-white">原始图片</h4>
            <div className="rounded-lg border border-slate-600 bg-slate-700 p-2">
              <img
                alt="原始图片"
                className="h-32 w-full rounded object-cover"
                src={task.originalImage.url}
              />
            </div>
          </div>

          {/* 任务详情 */}
          <div className="space-y-2">
            <h4 className="font-medium text-white">任务详情</h4>
            <div className="space-y-1 text-sm text-slate-300">
              <div>
                <span className="font-medium text-slate-200">编辑功能:</span>{" "}
                {task.editFunction}
              </div>
              <div>
                <span className="font-medium text-slate-200">提示词:</span>{" "}
                {task.prompt}
              </div>
              {task.maskImageUrl && (
                <div>
                  <span className="font-medium text-slate-200">蒙版图片:</span>
                  <a
                    className={`
                      ml-1 text-blue-400
                      hover:underline
                    `}
                    href={task.maskImageUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    查看蒙版
                  </a>
                </div>
              )}
              <div>
                <span className="font-medium text-slate-200">编辑强度:</span>{" "}
                {task.strength}
              </div>
              <div>
                <span className="font-medium text-slate-200">生成数量:</span>{" "}
                {task.imageCount}
              </div>
              <div>
                <span className="font-medium text-slate-200">创建时间:</span>{" "}
                {new Date(task.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* 编辑结果 */}
        {task.results && task.results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-white">
              编辑结果 ({task.results.length})
            </h4>
            <div
              className={`
                grid grid-cols-1 gap-4
                md:grid-cols-2
                lg:grid-cols-3
              `}
            >
              {task.results.map((result) => (
                <div className="space-y-2" key={result.id}>
                  <div
                    className={`
                      rounded-lg border border-slate-600 bg-slate-700 p-2
                    `}
                  >
                    <img
                      alt={`编辑结果 ${result.id}`}
                      className="h-32 w-full rounded object-cover"
                      src={result.resultImageUrl}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className={`
                        flex-1 border-slate-600 text-slate-300
                        hover:bg-slate-700 hover:text-white
                      `}
                      onClick={() =>
                        window.open(result.resultImageUrl, "_blank")
                      }
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      查看
                    </Button>
                    <Button
                      className={`
                        flex-1 border-slate-600 text-slate-300
                        hover:bg-slate-700 hover:text-white
                      `}
                      disabled={
                        savingResultId === result.id || !!result.savedImageId
                      }
                      onClick={() => handleSaveResult(result.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="mr-1 h-4 w-4" />
                      {savingResultId === result.id
                        ? "保存中..."
                        : result.savedImageId
                        ? "已保存"
                        : "保存"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {task.status === "failed" && task.errorMessage && (
          <div className="rounded-lg border border-red-600 bg-red-900/20 p-3">
            <p className="text-sm text-red-400">{task.errorMessage}</p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end border-t border-slate-600 pt-4">
          <Button
            className={`
              bg-red-600
              hover:bg-red-700
            `}
            disabled={isDeleting}
            onClick={handleDelete}
            size="sm"
            variant="destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {isDeleting ? "删除中..." : "删除任务"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
