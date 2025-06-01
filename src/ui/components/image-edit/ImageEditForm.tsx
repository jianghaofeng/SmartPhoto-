"use client";

import { useState } from "react";

import type { ImageEditFunction } from "~/db/schema";

import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/ui/primitives/select";
import { Slider } from "~/ui/primitives/slider";

interface ImageEditFormProps {
  imageId: string;
  imageUrl: string;
  isLoading?: boolean;
  onSubmit: (data: {
    editFunction: ImageEditFunction;
    imageCount?: number;
    maskImageUrl?: string;
    originalImageId: string;
    prompt: string;
    strength?: number;
  }) => Promise<void>;
}

const editFunctions: {
  description: string;
  label: string;
  requiresMask?: boolean;
  value: ImageEditFunction;
}[] = [
  {
    description: "根据描述修改图片内容",
    label: "描述编辑",
    value: "description_edit",
  },
  {
    description: "改变整张图片的风格",
    label: "全图风格化",
    value: "stylization_all",
  },
  {
    description: "改变图片局部区域的风格",
    label: "局部风格化",
    requiresMask: true,
    value: "stylization_local",
  },
  {
    description: "使用蒙版精确编辑指定区域",
    label: "蒙版编辑",
    requiresMask: true,
    value: "edit_with_mask",
  },
  {
    description: "去除图片中的文字水印",
    label: "去文字水印",
    value: "remove_watermark",
  },
  {
    description: "扩展图片边界",
    label: "扩图",
    value: "expand",
  },
  {
    description: "提升图片分辨率",
    label: "图像超分",
    value: "super_resolution",
  },
  {
    description: "为黑白图片添加颜色",
    label: "图像上色",
    value: "colorization",
  },
  {
    description: "将线稿转换为完整图片",
    label: "线稿生图",
    value: "doodle",
  },
  {
    description: "基于卡通形象生成图片",
    label: "卡通垫图",
    value: "control_cartoon_feature",
  },
];

export function ImageEditForm({
  imageId,
  imageUrl,
  isLoading,
  onSubmit,
}: ImageEditFormProps) {
  const [editFunction, setEditFunction] =
    useState<ImageEditFunction>("description_edit");
  const [prompt, setPrompt] = useState("");
  const [maskImageUrl, setMaskImageUrl] = useState("");
  const [strength, setStrength] = useState([0.5]);
  const [imageCount, setImageCount] = useState([1]);

  const selectedFunction = editFunctions.find((f) => f.value === editFunction);
  const requiresMask = selectedFunction?.requiresMask;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      alert("请输入编辑提示词");
      return;
    }

    if (requiresMask && !maskImageUrl.trim()) {
      alert("该编辑功能需要提供蒙版图片URL");
      return;
    }

    await onSubmit({
      editFunction,
      imageCount: imageCount[0],
      maskImageUrl: requiresMask ? maskImageUrl.trim() : undefined,
      originalImageId: imageId,
      prompt: prompt.trim(),
      strength: strength[0],
    });
  };

  return (
    <Card className="mx-auto w-full max-w-2xl border-slate-700 bg-slate-800">
      <CardHeader>
        <CardTitle className="text-white">AI 图像编辑</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 原始图片预览 */}
        <div className="space-y-2">
          <Label className="text-slate-300">原始图片</Label>
          <div className="rounded-lg border border-slate-600 bg-slate-700 p-4">
            <img
              alt="原始图片"
              className="mx-auto h-auto max-h-64 max-w-full rounded"
              src={imageUrl}
            />
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* 编辑功能选择 */}
          <div className="space-y-2">
            <Label className="text-slate-300" htmlFor="editFunction">
              编辑功能
            </Label>
            <Select
              onValueChange={(value) =>
                setEditFunction(value as ImageEditFunction)
              }
              value={editFunction}
            >
              <SelectTrigger
                className={`border-slate-600 bg-slate-700 text-white`}
              >
                <SelectValue placeholder="选择编辑功能" />
              </SelectTrigger>
              <SelectContent className="border-slate-600 bg-slate-700">
                {editFunctions.map((func) => (
                  <SelectItem
                    className={`
                      text-white
                      hover:bg-slate-600
                    `}
                    key={func.value}
                    value={func.value}
                  >
                    <div>
                      <div className="font-medium">{func.label}</div>
                      <div className="text-sm text-slate-400">
                        {func.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 编辑提示词 */}
          <div className="space-y-2">
            <Label className="text-slate-300" htmlFor="prompt">
              编辑提示词
            </Label>
            <Input
              className={`
                border-slate-600 bg-slate-700 text-white
                placeholder:text-slate-400
              `}
              id="prompt"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要的编辑效果..."
              required
              value={prompt}
            />
          </div>

          {/* 蒙版图片URL（条件显示） */}
          {requiresMask && (
            <div className="space-y-2">
              <Label className="text-slate-300" htmlFor="maskImageUrl">
                蒙版图片URL
              </Label>
              <Input
                className={`
                  border-slate-600 bg-slate-700 text-white
                  placeholder:text-slate-400
                `}
                id="maskImageUrl"
                onChange={(e) => setMaskImageUrl(e.target.value)}
                placeholder="输入蒙版图片的URL..."
                required
                value={maskImageUrl}
              />
              <p className="text-sm text-slate-400">
                蒙版图片应为黑白图像，白色区域将被编辑，黑色区域保持不变
              </p>
            </div>
          )}

          {/* 编辑强度 */}
          <div className="space-y-2">
            <Label className="text-slate-300">
              编辑强度: {strength[0].toFixed(1)}
            </Label>
            <Slider
              className="w-full"
              max={1}
              min={0}
              onValueChange={setStrength}
              step={0.1}
              value={strength}
            />
            <p className="text-sm text-slate-400">
              较低的值保持更多原始特征，较高的值产生更大的变化
            </p>
          </div>

          {/* 生成数量 */}
          <div className="space-y-2">
            <Label className="text-slate-300">生成数量: {imageCount[0]}</Label>
            <Slider
              className="w-full"
              max={4}
              min={1}
              onValueChange={setImageCount}
              step={1}
              value={imageCount}
            />
            <p className="text-sm text-slate-400">
              生成多张图片可以获得更多选择
            </p>
          </div>
          {/* 提交按钮 */}
          <Button
            className={`
            w-full bg-blue-600
            hover:bg-blue-700
          `}
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "处理中..." : "开始编辑"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
