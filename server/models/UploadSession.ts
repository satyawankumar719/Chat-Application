
import mongoose, { Types } from 'mongoose';
export interface uploadSessionSchemaInterface {
    uploadId: string;
    chatId: Types.ObjectId;
    userId: Types.ObjectId;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedBytes: number;
    status: string;
    tempFilePath: string;
    finalUrl: string;
}
const uploadSessionSchema = new mongoose.Schema<uploadSessionSchemaInterface>(
    {
        uploadId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fileName: {
            type: String,
            required: true,
        },
        fileSize: {
            type: Number,
            required: true,
        },
        fileType: {
            type: String,
            default: 'file',
        },
        uploadedBytes: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['uploading', 'upload_interrupted', 'upload_failed', 'upload_completed'],
            default: 'uploading',
        },
        tempFilePath: {
            type: String,
            default: null,
        },
        finalUrl: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('UploadSession', uploadSessionSchema);
