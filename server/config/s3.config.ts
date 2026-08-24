import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENV } from './envConfig.js';

export const s3Client = new S3Client({
  region: ENV.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const BUCKET_NAME = ENV.AWS_S3_BUCKET_NAME || '';
export const AWS_REGION = ENV.AWS_REGION || 'us-east-1';

export function isS3Configured(): boolean {
  return Boolean(
    ENV.AWS_ACCESS_KEY_ID &&
    ENV.AWS_ACCESS_KEY_ID !== 'your_aws_access_key_id' &&
    ENV.AWS_SECRET_ACCESS_KEY &&
    ENV.AWS_SECRET_ACCESS_KEY !== 'your_aws_secret_access_key' &&
    ENV.AWS_S3_BUCKET_NAME &&
    ENV.AWS_S3_BUCKET_NAME !== 'your_s3_bucket_name'
  );
}

export interface PresignedUrlOptions {
  fileName: string;
  fileType: string;
  subfolder?: string;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  fileUrl: string;
}

export async function generatePresignedUploadUrl({
  fileName,
  fileType,
  subfolder = 'files',
}: PresignedUrlOptions): Promise<PresignedUrlResult> {
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const key = `uploads/${subfolder}/${uniquePrefix}-${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  const fileUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    fileUrl,
  };
}
