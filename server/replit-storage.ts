
import { Client } from '@replit/object-storage';

const client = new Client();

export class ReplitStorage {
  static async uploadFile(filename: string, content: string | Buffer): Promise<string> {
    try {
      if (typeof content === 'string') {
        await client.uploadFromText(filename, content);
      } else {
        await client.uploadFromBytes(filename, content);
      }
      
      // Generate shareable URL
      const downloadUrl = await client.downloadUrlFor(filename, { 
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
      
      return downloadUrl;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  static async downloadFile(filename: string): Promise<string> {
    try {
      return await client.downloadAsText(filename);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  static async listFiles(): Promise<string[]> {
    try {
      const objects = await client.list();
      return objects.map(obj => obj.key);
    } catch (error) {
      console.error('List failed:', error);
      return [];
    }
  }

  static async deleteFile(filename: string): Promise<void> {
    try {
      await client.delete(filename);
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  }

  // Helper for ChatGPT: Save text content and get shareable URL
  static async saveForChatGPT(filename: string, content: string): Promise<string> {
    const downloadUrl = await this.uploadFile(filename, content);
    console.log(`File saved for ChatGPT: ${downloadUrl}`);
    return downloadUrl;
  }
}
