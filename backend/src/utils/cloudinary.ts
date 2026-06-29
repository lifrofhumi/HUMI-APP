import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (buffer: Buffer): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const cld_upload_stream = cloudinary.uploader.upload_stream(
      { folder: 'humi_events' },
      (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
          return;
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(cld_upload_stream);
  });
};

export const deleteFromCloudinary = (public_id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (error: any, result: any) => {
      if (error) {
        console.error('Cloudinary delete error:', error);
        reject(error);
        return;
      }
      resolve(result);
    });
  });
};
