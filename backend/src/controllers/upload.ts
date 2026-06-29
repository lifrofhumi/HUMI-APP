import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = (req: Request, res: Response): void => {
  console.log("Request received to /upload");
  console.log("Req body:", req.body);
  console.log("Req file:", req.file ? { fieldname: req.file.fieldname, mimetype: req.file.mimetype, size: req.file.size } : 'undefined');

  try {
    if (!req.file) {
      res.status(400).json({ 
        success: false,
        message: 'No image file provided. Make sure field name is "image" and file is an image.',
      });
      return;
    }

    console.log("Uploading to Cloudinary...");
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      {
        folder: 'humi_events',
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          res.status(500).json({ 
            success: false, 
            message: 'Failed to upload image to Cloudinary',
            details: error.message || error,
            stack: error.stack
          });
          return;
        }

        console.log("Cloudinary upload successful:", result.secure_url);
        res.status(200).json({
          success: true,
          message: 'Image uploaded successfully',
          url: result.secure_url,
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
  } catch (error: any) {
    console.error('Upload Controller Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Internal server error during upload',
      stack: error.stack
    });
  }
};
