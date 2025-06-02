import { createId } from "@paralleldrive/cuid2";
import { type NextRequest, NextResponse } from "next/server";

import { db } from "~/db";
import { uploadsTable } from "~/db/schema";
import { auth } from "~/lib/auth";
import { uploadToS3 } from "~/lib/s3";

export async function POST(request: NextRequest) {
  try {
    // verify user authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // validate file size
    const maxSize = file.type.startsWith("image/")
      ? 4 * 1024 * 1024
      : 64 * 1024 * 1024; // 4mb for images, 64mb for videos
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // upload to s3
    const uploadResult = await uploadToS3(file, "smartphoto");

    // save to database
    const uploadRecord = await db
      .insert(uploadsTable)
      .values({
        id: createId(),
        key: uploadResult.key,
        type: file.type.startsWith("image/") ? "image" : "video",
        url: uploadResult.url,
        userId: session.user.id,
      })
      .returning();

    return NextResponse.json({
      data: {
        id: uploadRecord[0].id,
        key: uploadResult.key,
        type: uploadRecord[0].type,
        url: uploadResult.url,
      },
      success: true,
    });
  } catch (error) {
    console.error("S3 upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
