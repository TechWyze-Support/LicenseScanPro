import { apiRequest } from './queryClient';

export interface OCRData {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  expirationDate?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  gender?: string;
  eyeColor?: string;
  height?: string;
  weight?: string;
  restrictions?: string;
  endorsements?: string;
  class?: string;
}

export interface OCRResult {
  success: boolean;
  data?: OCRData;
  confidence?: number;
  error?: string;
}

export class OCRService {
  async extractTextFromLicense(imageData: string): Promise<OCRResult> {
    try {
      console.log('Starting OCR text extraction from license image...');
      
      const response = await apiRequest('POST', '/api/ocr/extract', {
        imageData: imageData
      });

      const result = await response.json();
      
      console.log('OCR API response:', result);
      
      return result;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OCR error'
      };
    }
  }
}

export const ocrService = new OCRService();