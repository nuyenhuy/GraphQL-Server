import {Request, Response} from 'express';
import {uploadService} from '../service/upload.service.js';

export const uploadController = {
  async uploadFile(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        errorCode: "NO_FILE_UPLOADED",
        message: "No file uploaded",
        data: null,
      });
    }
    try {
      const result = await uploadService.processFile(req.file);
      res.json({
        success: true,
        errorCode: null,
        message: "File processed successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({
        success: false,
        errorCode: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        data: null,
      });
    }
  },
};

