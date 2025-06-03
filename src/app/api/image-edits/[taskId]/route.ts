import { type NextRequest, NextResponse } from "next/server";

import {
  deleteImageEditTask,
  getImageEditTaskStatus
} from "~/api/image-edits/service";
import { auth } from "~/lib/auth";

interface RouteParams {
  params: Promise<{
    taskId: string;
  }>;
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: "task id is required" }, { status: 400 });
    }

    // 删除任务
    await deleteImageEditTask(session.user.id, taskId);

    return NextResponse.json({
      message: "task deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("delete image edit task error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "internal server error" },
      { status: 500 }
    );
  }
}

// 获取任务状态
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    if (!taskId) {
      return NextResponse.json({ error: "task id is required" }, { status: 400 });
    }

    // 获取任务状态
    const result = await getImageEditTaskStatus(session.user.id, taskId);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    console.error("get image edit task status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "internal server error" },
      { status: 500 }
    );
  }
}