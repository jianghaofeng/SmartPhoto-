"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import type { WanxImageEditFunction } from "~/lib/wanx-image-edit";

import { FileUploader } from "~/ui/components/file-uploader";
import { Button } from "~/ui/primitives/button";
import { Card } from "~/ui/primitives/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/ui/primitives/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/ui/primitives/form";
import { Input } from "~/ui/primitives/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/ui/primitives/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { Textarea } from "~/ui/primitives/textarea";

interface GeneratedImage {
  createdAt: Date;
  id: string;
  imageUrl: string;
  prompt: string;
}

interface GenerateFormData {
  aspectRatio: string;
  height: number;
  model: WanxImageEditFunction;
  negativePrompt: string;
  prompt: string;
  quality: "1K" | "2K";
  width: number;
}

// 任务响应接口
interface TaskResponse {
  errorMessage?: string;
  results?: TaskResult[];
  status: TaskStatus;
  taskId: string;
}

// 任务结果接口
interface TaskResult {
  id: string;
  resultImageUrl: string;
  savedImageId?: string;
}

// 任务状态类型
type TaskStatus = "failed" | "pending" | "running" | "succeeded";

// 模型选项配置
const modelOptions = [
  {
    description: "黑白图片上色",
    label: "图像上色",
    value: "colorization" as WanxImageEditFunction,
  },
  {
    description: "通过指令编辑图像",
    label: "指令编辑",
    value: "description_edit" as WanxImageEditFunction,
  },
  {
    description: "局部区域风格化",
    label: "局部风格化",
    value: "stylization_local" as WanxImageEditFunction,
  },
  {
    description: "提升图像分辨率",
    label: "图像超分",
    value: "super_resolution" as WanxImageEditFunction,
  },
  {
    description: "扩展图像边界",
    label: "扩图",
    value: "expand" as WanxImageEditFunction,
  },
];

// 比例选项
const aspectRatios = [
  { height: 566, value: "21:9", width: 1360 },
  { height: 720, value: "16:9", width: 1280 },
  { height: 800, value: "3:2", width: 1200 },
  { height: 768, value: "4:3", width: 1024 },
  { height: 1024, value: "1:1", width: 1024 },
  { height: 1024, value: "3:4", width: 768 },
  { height: 1200, value: "2:3", width: 800 },
  { height: 1280, value: "9:16", width: 720 },
];

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [promptLength, setPromptLength] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<
    { id: string; name: string; url: string }[]
  >([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 任务状态相关状态
  const [currentTaskId, setCurrentTaskId] = useState<null | string>(null);
  const [taskStatus, setTaskStatus] = useState<null | TaskStatus>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [errorMessage, setErrorMessage] = useState<null | string>(null);

  const form = useForm<GenerateFormData>({
    defaultValues: {
      aspectRatio: "21:9",
      height: 566,
      model: "description_edit",
      negativePrompt: "",
      prompt: "",
      quality: "1K",
      width: 1360,
    },
  });

  // 处理文件上传
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
  };

  // 处理上传完成
  const handleUploadComplete = (
    results: { key: string; type: string; url: string }[]
  ) => {
    console.log("上传完成:", results);
    // 将上传成功的图片添加到已上传列表
    const newImages = results.map((result) => ({
      id: result.key, // 使用key作为id
      name: result.key.split("/").pop() || "未知文件",
      url: result.url,
    }));
    setUploadedImages((prev) => [...prev, ...newImages]);
  };

  // 处理比例变化
  const handleAspectRatioChange = (ratio: string) => {
    const selected = aspectRatios.find((r) => r.value === ratio);
    if (selected) {
      form.setValue("aspectRatio", ratio);
      form.setValue("width", selected.width);
      form.setValue("height", selected.height);
    }
  };

  // 轮询任务状态
  const pollTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/image-edits/${taskId}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("获取任务状态失败");
      }

      const data = (await response.json()) as { data: TaskResponse };
      const taskResponse = data.data;

      setTaskStatus(taskResponse.status);

      // 如果任务完成或失败，停止轮询
      if (taskResponse.status === "succeeded") {
        // 先停止轮询
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // 添加生成结果到列表（只添加一次）
        if (taskResponse.results && taskResponse.results.length > 0) {
          const newResults = taskResponse.results.map((result) => ({
            createdAt: new Date(),
            id: result.id,
            imageUrl: result.resultImageUrl,
            prompt: form.getValues("prompt"),
          }));

          setResults((prev) => {
            // 检查是否已经添加过这些结果，避免重复添加
            const existingIds = new Set(prev.map((r) => r.id));
            const filteredResults = newResults.filter(
              (r) => !existingIds.has(r.id)
            );
            return filteredResults.length > 0
              ? [...filteredResults, ...prev]
              : prev;
          });
        }

        // 重置状态和表单
        setCurrentTaskId(null);
        setTaskStatus(null);
        setLoading(false);
        form.reset(); // 生成成功后清除表单内容
        return; // 提前返回，避免继续执行
      } else if (taskResponse.status === "failed") {
        // 先停止轮询
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        setErrorMessage(taskResponse.errorMessage || "任务处理失败");
        setCurrentTaskId(null);
        setTaskStatus(null);
        setLoading(false);
        return; // 提前返回，避免继续执行
      }
    } catch (error) {
      console.error("轮询任务状态失败:", error);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      setErrorMessage("获取任务状态失败");
      setCurrentTaskId(null);
      setTaskStatus(null);
      setLoading(false);
    }
  };

  // 从数据库加载历史生成结果
  const loadHistoryResults = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch("/api/image-edits?limit=20&offset=0");

      if (!response.ok) {
        throw new Error("获取历史记录失败");
      }

      const data = (await response.json()) as {
        data?: any[];
        success: boolean;
      };

      if (data.success && data.data) {
        // 转换数据库结果为页面所需格式
        const historyResults: GeneratedImage[] = [];

        data.data.forEach((task: any) => {
          if (task.results && task.results.length > 0) {
            task.results.forEach((result: any) => {
              historyResults.push({
                createdAt: new Date(result.createdAt),
                id: result.id,
                imageUrl: result.resultImageUrl,
                prompt: task.prompt,
              });
            });
          }
        });

        setResults(historyResults);
      }
    } catch (error) {
      console.error("加载历史记录失败:", error);
      setErrorMessage("加载历史记录失败");
    } finally {
      setLoadingHistory(false);
    }
  };

  // 页面加载时获取历史记录
  useEffect(() => {
    loadHistoryResults();
  }, []);

  // 清理轮询间隔
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // 处理生成图片
  const handleGenerate = async (data: GenerateFormData) => {
    if (!data.prompt) return;
    if (uploadedImages.length === 0) {
      setErrorMessage("请先上传一张图片");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // 调用图像编辑API创建任务
      const response = await fetch("/api/image-edits", {
        body: JSON.stringify({
          editFunction: data.model,
          // 添加可选参数，如果需要的话
          imageCount: 1, // 默认生成1张图片
          originalImageId: uploadedImages[0].id, // 确保这个id是有效的图片ID
          prompt: data.prompt,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("创建图像编辑任务失败");
      }

      const responseData = (await response.json()) as {
        data?: { taskId: string };
        error?: string;
        success: boolean;
      };

      if (!responseData.success || !responseData.data) {
        throw new Error("创建任务失败: " + (responseData.error || "未知错误"));
      }

      const taskId = responseData.data.taskId;
      setCurrentTaskId(taskId);
      setTaskStatus("pending");

      // 开始轮询任务状态
      pollingIntervalRef.current = setInterval(
        () => pollTaskStatus(taskId),
        3000
      ); // 每3秒轮询一次
    } catch (error) {
      console.error("生成失败:", error);
      setErrorMessage(error instanceof Error ? error.message : "创建任务失败");
      setLoading(false);
    }
  };

  // 处理图片点击放大
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setDialogOpen(true);
  };

  // 获取任务状态显示文本
  const getTaskStatusText = () => {
    switch (taskStatus) {
      case "pending":
        return "等待处理中...";
      case "running":
        return "正在生成图片...";
      default:
        return "生成中...";
    }
  };

  return (
    <div className="h-screen bg-background">
      <ResizablePanelGroup className="h-full" direction="horizontal">
        {/* 左侧表单面板 */}
        <ResizablePanel defaultSize={30} maxSize={50} minSize={20}>
          <div className="h-full overflow-auto border-r bg-muted/5">
            <div className="space-y-6 p-4">
              {/* 图片上传组件 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">上传图片</h3>

                {/* 只有在没有已上传图片时才显示拖拽框 */}
                {uploadedImages.length === 0 && (
                  <FileUploader
                    accept={{
                      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                    }}
                    maxFiles={1}
                    maxSize={10 * 1024 * 1024} // 10MB
                    onFilesChange={handleFilesChange}
                    onUploadComplete={handleUploadComplete}
                    value={uploadedFiles}
                  />
                )}

                {/* 已上传成功的图片 */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      已上传成功：
                    </p>
                    <div className="space-y-2">
                      {uploadedImages.map((image) => (
                        <div
                          className={`
                            group relative aspect-square w-20 cursor-pointer
                            overflow-hidden rounded-lg border
                          `}
                          key={image.id}
                          onClick={() => handleImageClick(image.url)}
                        >
                          <img
                            alt="已上传的图片"
                            className={`
                              h-full w-full object-cover transition-transform
                              group-hover:scale-110
                            `}
                            src={image.url}
                          />
                          <Button
                            className={`
                              absolute top-1 right-1 h-6 w-6 p-0 opacity-0
                              group-hover:opacity-100
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedImages((prev) =>
                                prev.filter((img) => img.id !== image.id)
                              );
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Form {...form}>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(handleGenerate)}
                >
                  {/* 模型选择 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">功能</h3>
                      <Button className="h-6 w-6 p-0" size="sm" variant="ghost">
                        <span className="text-xs">▲</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {/* <p className="text-xs text-muted-foreground">生图模型</p> */}
                      <FormField
                        control={form.control}
                        name="model"
                        render={({ field }) => (
                          <FormItem>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className={`border-muted bg-muted/20`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {modelOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    <div className={`flex items-center gap-3`}>
                                      <div
                                        className={`
                                          h-8 w-8 flex-shrink-0 rounded-lg
                                          bg-gradient-to-br from-purple-400
                                          to-pink-400
                                        `}
                                      />
                                      <div>
                                        <div className="font-medium">
                                          {option.label}
                                        </div>
                                        <div
                                          className={`
                                            text-xs text-muted-foreground
                                          `}
                                        >
                                          {option.description}
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 清晰度选择 */}
                    {/*<div className="space-y-2">*/}
                    {/*  <p className="text-xs text-muted-foreground">*/}
                    {/*    选择清晰度：标清 1K*/}
                    {/*  </p>*/}
                    {/*  <FormField*/}
                    {/*    control={form.control}*/}
                    {/*    name="quality"*/}
                    {/*    render={({ field }) => (*/}
                    {/*      <FormItem>*/}
                    {/*        <FormControl>*/}
                    {/*          <div className="grid grid-cols-2 gap-2">*/}
                    {/*            <Button*/}
                    {/*              className="h-10"*/}
                    {/*              onClick={() => field.onChange("1K")}*/}
                    {/*              size="sm"*/}
                    {/*              type="button"*/}
                    {/*              variant={*/}
                    {/*                field.value === "1K" ? "default" : "outline"*/}
                    {/*              }*/}
                    {/*            >*/}
                    {/*              标清 1K*/}
                    {/*            </Button>*/}
                    {/*            <Button*/}
                    {/*              className="h-10"*/}
                    {/*              onClick={() => field.onChange("2K")}*/}
                    {/*              size="sm"*/}
                    {/*              type="button"*/}
                    {/*              variant={*/}
                    {/*                field.value === "2K" ? "default" : "outline"*/}
                    {/*              }*/}
                    {/*            >*/}
                    {/*              高清 2K ✨*/}
                    {/*            </Button>*/}
                    {/*          </div>*/}
                    {/*        </FormControl>*/}
                    {/*      </FormItem>*/}
                    {/*    )}*/}
                    {/*  />*/}
                    {/*</div>*/}
                  </div>
                  {/* 提示词输入 */}
                  <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        {/* <FormLabel
                          className={`text-sm font-medium text-muted-foreground`}
                        >
                          描述想要生成的图片
                        </FormLabel> */}
                        <FormControl>
                          <div className="relative">
                            <Textarea
                              className={`
                                min-h-[120px] resize-none border-muted
                                bg-muted/20 text-sm
                              `}
                              maxLength={800}
                              placeholder="描述想要生成的图片"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                setPromptLength(e.target.value.length);
                              }}
                            />
                            <div
                              className={`
                                absolute right-2 bottom-2 text-xs
                                text-muted-foreground
                              `}
                            >
                              {promptLength}/800
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                    rules={{ required: "请输入提示词" }}
                  />

                  {/* 比例选择 */}
                  {/*<div className="space-y-3">*/}
                  {/*  <div className="flex items-center justify-between">*/}
                  {/*    <h3 className="text-sm font-medium">比例</h3>*/}
                  {/*    <Button className="h-6 w-6 p-0" size="sm" variant="ghost">*/}
                  {/*      <span className="text-xs">▲</span>*/}
                  {/*    </Button>*/}
                  {/*  </div>*/}

                  {/*  <div className="space-y-2">*/}
                  {/*    <p className="text-xs text-muted-foreground">图片比例</p>*/}
                  {/*    <FormField*/}
                  {/*      control={form.control}*/}
                  {/*      name="aspectRatio"*/}
                  {/*      render={({ field }) => (*/}
                  {/*        <FormItem>*/}
                  {/*          <FormControl>*/}
                  {/*            <div className="grid grid-cols-5 gap-2">*/}
                  {/*              {aspectRatios.map((ratio) => (*/}
                  {/*                <Button*/}
                  {/*                  className="h-16 flex-col gap-1"*/}
                  {/*                  key={ratio.value}*/}
                  {/*                  onClick={() =>*/}
                  {/*                    handleAspectRatioChange(ratio.value)*/}
                  {/*                  }*/}
                  {/*                  size="sm"*/}
                  {/*                  type="button"*/}
                  {/*                  variant={*/}
                  {/*                    field.value === ratio.value*/}
                  {/*                      ? "default"*/}
                  {/*                      : "outline"*/}
                  {/*                  }*/}
                  {/*                >*/}
                  {/*                  <div className="h-4 w-6 rounded-sm bg-muted" />*/}
                  {/*                  <span className="text-xs">*/}
                  {/*                    {ratio.value}*/}
                  {/*                  </span>*/}
                  {/*                </Button>*/}
                  {/*              ))}*/}
                  {/*            </div>*/}
                  {/*          </FormControl>*/}
                  {/*        </FormItem>*/}
                  {/*      )}*/}
                  {/*    />*/}
                  {/*  </div>*/}

                  {/*  /!* 图片尺寸 *!/*/}
                  {/*  <div className="space-y-2">*/}
                  {/*    <div className="flex items-center gap-2">*/}
                  {/*      <p className="text-xs text-muted-foreground">*/}
                  {/*        图片尺寸*/}
                  {/*      </p>*/}
                  {/*      <div*/}
                  {/*        className={`*/}
                  {/*          flex h-4 w-4 items-center justify-center*/}
                  {/*          rounded-full bg-muted*/}
                  {/*        `}*/}
                  {/*      >*/}
                  {/*        <span className="text-xs">i</span>*/}
                  {/*      </div>*/}
                  {/*    </div>*/}
                  {/*    <div className="grid grid-cols-3 items-center gap-2">*/}
                  {/*      <FormField*/}
                  {/*        control={form.control}*/}
                  {/*        name="width"*/}
                  {/*        render={({ field }) => (*/}
                  {/*          <FormItem>*/}
                  {/*            <FormControl>*/}
                  {/*              <div className="relative">*/}
                  {/*                <Input*/}
                  {/*                  className={`*/}
                  {/*                    border-muted bg-muted/20 text-center*/}
                  {/*                  `}*/}
                  {/*                  type="number"*/}
                  {/*                  {...field}*/}
                  {/*                  onChange={(e) =>*/}
                  {/*                    field.onChange(Number(e.target.value))*/}
                  {/*                  }*/}
                  {/*                />*/}
                  {/*                <span*/}
                  {/*                  className={`*/}
                  {/*                    absolute top-1/2 left-2 -translate-y-1/2*/}
                  {/*                    text-xs text-muted-foreground*/}
                  {/*                  `}*/}
                  {/*                >*/}
                  {/*                  W*/}
                  {/*                </span>*/}
                  {/*              </div>*/}
                  {/*            </FormControl>*/}
                  {/*          </FormItem>*/}
                  {/*        )}*/}
                  {/*      />*/}
                  {/*      <div className="flex items-center justify-center">*/}
                  {/*        <div*/}
                  {/*          className={`*/}
                  {/*            flex h-6 w-6 items-center justify-center*/}
                  {/*            rounded-full bg-muted*/}
                  {/*          `}*/}
                  {/*        >*/}
                  {/*          <span className="text-xs">🔗</span>*/}
                  {/*        </div>*/}
                  {/*      </div>*/}
                  {/*      <FormField*/}
                  {/*        control={form.control}*/}
                  {/*        name="height"*/}
                  {/*        render={({ field }) => (*/}
                  {/*          <FormItem>*/}
                  {/*            <FormControl>*/}
                  {/*              <div className="relative">*/}
                  {/*                <Input*/}
                  {/*                  className={`*/}
                  {/*                    border-muted bg-muted/20 text-center*/}
                  {/*                  `}*/}
                  {/*                  type="number"*/}
                  {/*                  {...field}*/}
                  {/*                  onChange={(e) =>*/}
                  {/*                    field.onChange(Number(e.target.value))*/}
                  {/*                  }*/}
                  {/*                />*/}
                  {/*                <span*/}
                  {/*                  className={`*/}
                  {/*                    absolute top-1/2 left-2 -translate-y-1/2*/}
                  {/*                    text-xs text-muted-foreground*/}
                  {/*                  `}*/}
                  {/*                >*/}
                  {/*                  H*/}
                  {/*                </span>*/}
                  {/*              </div>*/}
                  {/*            </FormControl>*/}
                  {/*          </FormItem>*/}
                  {/*        )}*/}
                  {/*      />*/}
                  {/*    </div>*/}
                  {/*  </div>*/}
                  {/*</div>*/}

                  {/* 错误信息显示 */}
                  {errorMessage && (
                    <div className="rounded-md bg-red-50 p-3">
                      <p className="text-sm text-red-600">{errorMessage}</p>
                    </div>
                  )}

                  {/* 生成按钮 */}
                  <Button
                    className={`
                      h-12 w-full bg-gradient-to-r from-purple-500 to-pink-500
                      text-base font-medium
                      hover:from-purple-600 hover:to-pink-600
                    `}
                    disabled={loading}
                    size="lg"
                    type="submit"
                  >
                    {loading ? getTaskStatusText() : "生成图片"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* 右侧内容面板 */}
        <ResizablePanel defaultSize={70}>
          <div className="h-full overflow-auto">
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold">生成结果</h1>
                <p className="text-muted-foreground">
                  共 {results.length} 张图片
                </p>
              </div>

              {loadingHistory ? (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-6xl opacity-20">⏳</div>
                    <p className="text-lg font-medium text-muted-foreground">
                      正在加载历史生成记录...
                    </p>
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-6xl opacity-20">🎨</div>
                    <p className="text-lg font-medium text-muted-foreground">
                      还没有生成任何图片
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      在左侧表单中输入提示词开始生成
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`
                    grid grid-cols-1 gap-6
                    md:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4
                  `}
                >
                  {results.map((result) => (
                    <Card
                      className={`
                        overflow-hidden transition-shadow
                        hover:shadow-lg
                      `}
                      key={result.id}
                    >
                      <div className="group relative aspect-square">
                        <img
                          alt={result.prompt}
                          className={`
                            h-full w-full object-cover transition-transform
                            group-hover:scale-105
                          `}
                          src={result.imageUrl}
                        />
                      </div>
                      <div className="p-4">
                        <p className="mb-2 line-clamp-2 text-sm font-medium">
                          {result.prompt}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {result.createdAt.toLocaleString("zh-CN", {
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* 图片放大对话框 */}
      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>查看图片</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img
              alt="放大后的图片"
              className="max-h-[80vh] max-w-[80vw] object-contain"
              src={selectedImageUrl}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
