import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createId } from "@paralleldrive/cuid2";

// 使用阿里云OSS的S3兼容端点
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.OSS_SECRET_ACCESS_KEY!,
    },
    endpoint: `https://${process.env.OSS_REGION!}.aliyuncs.com`,
    forcePathStyle: false,
    region: process.env.OSS_REGION!,
});

const BUCKET_NAME = process.env.OSS_BUCKET_NAME!;
const BUCKET_URL = process.env.OSS_BUCKET_URL!;

export interface UploadResult {
    key: string;
    size: number;
    url: string;
}

// delete s3 file
export async function deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

// generate presigned upload url for client-side direct upload
export async function getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600
): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        ContentType: contentType,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

// generate presigned url for private file access
export async function getPresignedUrl(
    key: string,
    expiresIn = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
}

// upload file to s3 (阿里云OSS S3兼容)
export async function uploadToS3(
    file: File,
    folder = "uploads"
): Promise<UploadResult> {
    const fileExtension = file.name.split(".").pop();
    const key = `${folder}/${createId()}.${fileExtension}`;

    const command = new PutObjectCommand({
        ACL: "public-read", // 或使用 'private' 然后通过预签名URL访问
        Body: Buffer.from(await file.arrayBuffer()),
        Bucket: BUCKET_NAME,
        ContentType: file.type,
        Key: key,
    });

    await s3Client.send(command);

    return {
        key,
        size: file.size,
        url: `${BUCKET_URL}/${key}`,
    };
}
