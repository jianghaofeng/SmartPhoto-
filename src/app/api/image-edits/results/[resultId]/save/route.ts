import { type NextRequest, NextResponse } from "next/server";

import { saveEditResultToLocal } from "~/api/image-edits/service";
import { auth } from "~/lib/auth";

interface RouteParams {
  params: Promise<{
    resultId: string;
  }>;
}

// 保存编辑结果到本地存储
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { resultId } = await params;
    if (!resultId) {
      return NextResponse.json({ error: "result id is required" }, { status: 400 });
    }

    // 保存结果到本地
    const result = await saveEditResultToLocal(session.user.id, resultId);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    console.error("save edit result error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "internal server error" },
      { status: 500 }
    );
  }
}