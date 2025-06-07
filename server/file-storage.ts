import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export interface SavedFile {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
}

export async function saveAudioFile(
  buffer: Buffer, 
  originalName: string = 'recording.webm',
  mimeType: string = 'audio/webm'
): Promise<SavedFile> {
  try {
    // Generate unique filename with proper extension
    let fileExtension = path.extname(originalName);
    
    // If no extension, derive from MIME type
    if (!fileExtension) {
      if (mimeType.startsWith('image/')) {
        fileExtension = mimeType.includes('png') ? '.png' : '.jpg';
      } else if (mimeType.startsWith('audio/')) {
        fileExtension = '.webm';
      } else if (mimeType.includes('pdf')) {
        fileExtension = '.pdf';
      } else {
        fileExtension = '.bin';
      }
    }
    
    const filename = `${randomUUID()}${fileExtension}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    
    // Save file to disk
    await fs.promises.writeFile(filepath, buffer);
    
    return {
      filename,
      originalName,
      url: `/uploads/${filename}`,
      size: buffer.length,
      mimeType
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
}

export async function deleteFile(filename: string): Promise<void> {
  try {
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      await fs.promises.unlink(filepath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error, just log it
  }
}

export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}