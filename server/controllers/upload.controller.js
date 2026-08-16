import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import UploadSession from '../models/UploadSession.js';

const UPLOADS_DIR = path.resolve('uploads');
const TEMP_DIR = path.resolve('uploads/temp');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

export const initUpload = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { uploadId, chatId, fileName, fileSize, fileType } = req.body;

    if (!chatId || !fileName || !fileSize) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters (chatId, fileName, fileSize).',
      });
    }

    const sessionUploadId = uploadId || `up_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    let session = await UploadSession.findOne({ uploadId: sessionUploadId });

    if (!session) {
      const safeFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const tempPath = path.join(TEMP_DIR, safeFileName);

      session = await UploadSession.create({
        uploadId: sessionUploadId,
        chatId,
        userId,
        fileName,
        fileSize: Number(fileSize),
        fileType: fileType || 'file',
        uploadedBytes: 0,
        status: 'uploading',
        tempFilePath: tempPath,
      });

      // Ensure temp directory and empty file created
      if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR, { recursive: true });
      }
      fs.writeFileSync(tempPath, Buffer.alloc(0));
    }

    return res.status(200).json({
      success: true,
      data: {
        uploadId: session.uploadId,
        uploadedBytes: session.uploadedBytes,
        fileSize: session.fileSize,
        status: session.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadChunk = async (req, res, next) => {
  try {
    const { uploadId, startByte } = req.body;
    const chunkFile = req.file;

    if (!uploadId || !chunkFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing uploadId or chunk file data.',
      });
    }

    const session = await UploadSession.findOne({ uploadId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found.',
      });
    }

    const start = Number(startByte || 0);
    const chunkBuffer = fs.readFileSync(chunkFile.path);

    // Ensure parent temp directory exists before writing
    const tempDir = path.dirname(session.tempFilePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write chunk synchronously to specified byte position safely
    const fd = fs.openSync(session.tempFilePath, start === 0 || !fs.existsSync(session.tempFilePath) ? 'w+' : 'r+');
    try {
      fs.writeSync(fd, chunkBuffer, 0, chunkBuffer.length, start);
    } finally {
      fs.closeSync(fd);
    }

    // Remove uploaded chunk temp file from multer
    try {
      if (fs.existsSync(chunkFile.path)) fs.unlinkSync(chunkFile.path);
    } catch {}

    const newUploadedBytes = Math.min(session.fileSize, start + chunkBuffer.length);
    session.uploadedBytes = newUploadedBytes;
    session.status = 'uploading';

    if (newUploadedBytes >= session.fileSize) {
      let subfolder = 'files';
      if (
        session.fileType === 'avatar' ||
        session.fileName.includes('avatar')
      ) {
        subfolder = 'avatars';
      } else if (
        session.fileType === 'image' ||
        session.fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      ) {
        subfolder = 'images';
      } else if (
        session.fileType === 'video' ||
        session.fileName.match(/\.(mp4|webm|mkv|mov|avi)$/i)
      ) {
        subfolder = 'videos';
      }

      const targetDir = path.join(UPLOADS_DIR, subfolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const finalFileName = `${Date.now()}-${session.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const finalPath = path.join(targetDir, finalFileName);

      fs.renameSync(session.tempFilePath, finalPath);

      const protocol = req.protocol;
      const host = req.get('host');
      const fileUrl = `${protocol}://${host}/uploads/${subfolder}/${finalFileName}`;

      session.status = 'upload_completed';
      session.finalUrl = fileUrl;
      await session.save();

      return res.status(200).json({
        success: true,
        data: {
          completed: true,
          uploadId: session.uploadId,
          uploadedBytes: newUploadedBytes,
          fileSize: session.fileSize,
          fileUrl,
          fileName: session.fileName,
          type: session.fileType,
          status: 'upload_completed',
        },
      });
    }

    await session.save();

    return res.status(200).json({
      success: true,
      data: {
        completed: false,
        uploadId: session.uploadId,
        uploadedBytes: newUploadedBytes,
        fileSize: session.fileSize,
        status: 'uploading',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUploadStatus = async (req, res, next) => {
  try {
    const { uploadId } = req.params;
    const session = await UploadSession.findOne({ uploadId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Upload session not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        uploadId: session.uploadId,
        uploadedBytes: session.uploadedBytes,
        fileSize: session.fileSize,
        status: session.status,
        finalUrl: session.finalUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const interruptUpload = async (req, res, next) => {
  try {
    let uploadId = req.body?.uploadId || req.query?.uploadId;

    if (!uploadId && typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        uploadId = parsed.uploadId;
      } catch {}
    }

    if (uploadId) {
      await UploadSession.updateOne(
        { uploadId, status: 'uploading' },
        { status: 'upload_interrupted' }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Upload interrupted recorded.',
    });
  } catch (error) {
    next(error);
  }
};
