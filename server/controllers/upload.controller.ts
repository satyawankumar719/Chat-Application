import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/express.js';
import { generatePresignedUploadUrl, isS3Configured } from '../config/s3.config.js';

export const getPresignedUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { fileName, fileType, folder } = req.body || {};

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: fileName and fileType.',
      });
    }

    if (!isS3Configured()) {
      return res.status(500).json({
        success: false,
        message: 'AWS S3 is not configured on the server. Please check environment variables.',
      });
    }

    let subfolder = folder || 'files';
    if (!folder) {
      if (fileType.startsWith('image/')) subfolder = 'images';
      else if (fileType.startsWith('video/')) subfolder = 'videos';
    }

    const presignedData = await generatePresignedUploadUrl({
      fileName,
      fileType,
      subfolder,
    });

    return res.status(200).json({
      success: true,
      data: presignedData,
    });
  } catch (error) {
    next(error);
  }
};
