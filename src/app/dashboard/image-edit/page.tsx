"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  ImageEditFunction,
  ImageEditResult,
  ImageEditTask,
} from "~/db/schema";

import { ImageEditForm } from "~/ui/components/image-edit/ImageEditForm";
import { ImageEditTaskCard } from "~/ui/components/image-edit/ImageEditTaskCard";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

interface ImageEditTaskWithDetails extends ImageEditTask {
  id: string;
  originalImage: {
    id: string;
    url: string;
  };
  results: (ImageEditResult & { savedImageId?: string })[];
}

export default function ImageEditPage() {
  const router = useRouter();
  const [selectedImageId, setSelectedImageId] = useState<string>("");
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [tasks, setTasks] = useState<ImageEditTaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [activeTab, setActiveTab] = useState("edit");

  // 加载用户的编辑任务
  const loadTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const response = await fetch("/api/image-edits");
      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }
      const data = (await response.json()) as {
        data: ImageEditTaskWithDetails[];
      };
      setTasks(data.data || []);
    } catch (error) {
      console.error("Load tasks error:", error);
      alert("加载任务失败");
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    loadTasks();
  }, []);

  // 处理图像编辑提交
  const handleEditSubmit = async (data: {
    editFunction: ImageEditFunction;
    imageCount?: number;
    maskImageUrl?: string;
    originalImageId: string;
    prompt: string;
    strength?: number;
  }) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/image-edits", {
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        throw new Error(error.error || "编辑失败");
      }

      alert("编辑任务已创建，请在任务列表中查看进度");

      // 切换到任务列表标签页并刷新任务
      setActiveTab("tasks");
      await loadTasks();
    } catch (error) {
      console.error("Edit submit error:", error);
      alert(error instanceof Error ? error.message : "编辑失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/image-edits/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      // 从列表中移除已删除的任务
      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      alert("任务已删除");
    } catch (error) {
      console.error("Delete task error:", error);
      alert("删除失败");
    }
  };

  // 保存编辑结果
  const handleSaveResult = async (resultId: string) => {
    try {
      const response = await fetch(
        `/api/image-edits/results/${resultId}/save`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("保存失败");
      }

      const result = (await response.json()) as {
        data?: { savedImageId: string };
        success: boolean;
      };

      // 更新任务列表中的结果状态
      setTasks((prev) =>
        prev.map((task) => ({
          ...task,
          results: task.results.map((r) =>
            r.id === resultId
              ? ({
                  ...r,
                  savedImageId: result.data?.savedImageId,
                } as ImageEditResult & { savedImageId?: string })
              : r
          ),
        }))
      );

      alert("结果已保存到本地");
    } catch (error) {
      console.error("Save result error:", error);
      alert("保存失败");
    }
  };

  // 刷新任务状态
  const handleRefreshStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/image-edits/${taskId}`);
      if (!response.ok) {
        throw new Error("刷新失败");
      }

      const result = (await response.json()) as {
        data?: Partial<ImageEditTaskWithDetails>;
        success: boolean;
      };

      // 更新任务列表中的特定任务
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...result.data } : task
        )
      );
    } catch (error) {
      console.error("Refresh status error:", error);
      alert("刷新失败");
    }
  };

  // 处理图片URL输入
  const handleImageUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImageUrl.trim()) {
      alert("请输入图片URL");
      return;
    }

    try {
      setIsLoading(true);
      // 调用URL上传API
      const response = await fetch("/api/media/url-upload", {
        body: JSON.stringify({ url: selectedImageUrl.trim() }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(error.message || "上传失败");
      }

      const result = (await response.json()) as {
        data?: { id: string };
        success: boolean;
      };
      if (result.success && result.data?.id) {
        setSelectedImageId(result.data.id);
      } else {
        throw new Error("上传成功但无法获取图片ID");
      }
    } catch (error) {
      console.error("URL upload error:", error);
      alert(error instanceof Error ? error.message : "上传失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 顶部导航栏 */}
      <div className="border-b border-slate-700 bg-slate-800">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-semibold text-white">AI 图像编辑</h1>
          <div className="ml-auto flex items-center space-x-4">
            <div className="text-sm text-slate-300">智能图像处理平台</div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* 左侧边栏 */}
        <div className="w-64 border-r border-slate-700 bg-slate-800">
          <div className="p-4">
            <div className="space-y-2">
              <Button
                className={`
                  w-full rounded-lg px-3 py-2 text-left text-sm
                  transition-colors
                  ${
                    activeTab === "edit"
                      ? "bg-blue-600 text-white"
                      : `
                        text-slate-300
                        hover:bg-slate-700 hover:text-white
                      `
                  }
                `}
                onClick={() => setActiveTab("edit")}
              >
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-current" />
                  <span>图像编辑</span>
                </div>
              </Button>
              <Button
                className={`
                  w-full rounded-lg px-3 py-2 text-left text-sm
                  transition-colors
                  ${
                    activeTab === "tasks"
                      ? "bg-blue-600 text-white"
                      : `
                        text-slate-300
                        hover:bg-slate-700 hover:text-white
                      `
                  }
                `}
                onClick={() => setActiveTab("tasks")}
              >
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-current" />
                  <span>任务列表</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1">
          <div className="p-6">
            {activeTab === "edit" && (
              <div className="space-y-6">
                {/* 图片选择区域 */}
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">
                      选择要编辑的图片
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 方式1: 输入图片URL */}
                    <form className="space-y-4" onSubmit={handleImageUrlSubmit}>
                      <div className="space-y-2">
                        <Label className="text-slate-300" htmlFor="imageUrl">
                          图片URL
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            className={`
                              flex-1 border-slate-600 bg-slate-700 text-white
                              placeholder:text-slate-400
                            `}
                            id="imageUrl"
                            onChange={(e) =>
                              setSelectedImageUrl(e.target.value)
                            }
                            placeholder="https://example.com/image.jpg"
                            type="url"
                            value={selectedImageUrl}
                          />
                          <Button
                            className={`
                              bg-blue-600
                              hover:bg-blue-700
                            `}
                            type="submit"
                          >
                            确认
                          </Button>
                        </div>
                      </div>
                    </form>

                    {/* 方式2: 上传新图片 */}
                    <div className="border-t border-slate-600 py-4 text-center">
                      <p className="mb-2 text-sm text-slate-400">或者</p>
                      <Button
                        className={`
                          border-slate-600 text-slate-300
                          hover:bg-slate-700 hover:text-white
                        `}
                        onClick={() => router.push("/dashboard/uploads")}
                        variant="outline"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        上传新图片
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 图像编辑表单 */}
                {selectedImageId && selectedImageUrl && (
                  <ImageEditForm
                    imageId={selectedImageId}
                    imageUrl={selectedImageUrl}
                    isLoading={isLoading}
                    onSubmit={handleEditSubmit}
                  />
                )}
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">
                    编辑任务
                  </h2>
                  <Button
                    className={`
                      bg-blue-600
                      hover:bg-blue-700
                    `}
                    disabled={isLoadingTasks}
                    onClick={loadTasks}
                  >
                    {isLoadingTasks ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    刷新
                  </Button>
                </div>

                {isLoadingTasks ? (
                  <div className="py-8 text-center">
                    <Loader2
                      className={`
                        mx-auto mb-2 h-8 w-8 animate-spin text-blue-400
                      `}
                    />
                    <p className="text-slate-400">加载中...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <Card className="border-slate-700 bg-slate-800">
                    <CardContent className="py-8 text-center">
                      <p className="text-slate-400">暂无编辑任务</p>
                      <Button
                        className={`
                          mt-4 bg-blue-600
                          hover:bg-blue-700
                        `}
                        onClick={() => setActiveTab("edit")}
                      >
                        开始编辑
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {tasks.map((task) => (
                      <ImageEditTaskCard
                        key={task.id}
                        onDelete={handleDeleteTask}
                        onRefreshStatus={handleRefreshStatus}
                        onSaveResult={handleSaveResult}
                        task={task}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
