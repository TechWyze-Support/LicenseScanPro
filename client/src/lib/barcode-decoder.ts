// PDF417 barcode decoder utilities using ZXing library
import { BrowserMultiFormatReader } from '@zxing/browser';

export interface BarcodeData {
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
}

export interface BarcodeDecodeResult {
  success: boolean;
  data?: BarcodeData;
  confidence?: number;
  error?: string;
}

export class BarcodeDecoder {
  private readonly fieldMapping: Record<string, keyof BarcodeData> = {
    'DAC': 'firstName',
    'DCS': 'lastName',
    'DAD': 'middleName',
    'DBB': 'dateOfBirth',
    'DAQ': 'licenseNumber',
    'DBA': 'expirationDate',
    'DAG': 'address',
    'DAI': 'city',
    'DAJ': 'state',
    'DAK': 'zipCode'
  };

  private reader = new BrowserMultiFormatReader();

  async decodeBarcode(imageData: string): Promise<BarcodeDecodeResult> {
    try {
      console.log('Starting barcode decode process...');
      
      // Preprocess image for better barcode detection
      const enhancedImageData = await this.preprocessImage(imageData);
      
      // Create image element from enhanced data URL
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = enhancedImageData;
      });

      console.log('Image loaded, attempting barcode decode...');

      // Use ZXing's browser reader to decode from image element
      const result = await this.reader.decodeFromImageElement(img);
      
      console.log('Raw barcode data:', result.getText());

      // Parse the AAMVA data
      const parsedData = this.parseAAMVAData(result.getText());
      
      return {
        success: true,
        data: parsedData,
        confidence: 0.95
      };

    } catch (error) {
      console.error('Barcode decode error:', error);
      
      // If barcode decoding fails, return an error
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Could not decode PDF417 barcode from image. Please ensure the license is clearly visible and try again.'
      };
    }
  }

  private parseAAMVAData(rawData: string): BarcodeData {
    const data: BarcodeData = {};
    
    // AAMVA data can be in various formats, try different parsing approaches
    
    // First, try line-by-line parsing for structured data
    const lines = rawData.split(/[\n\r]+/);
    for (const line of lines) {
      const match = line.match(/^([A-Z]{3})(.+)$/);
      if (match) {
        const [, code, value] = match;
        const field = this.fieldMapping[code];
        if (field) {
          data[field] = value.trim();
        }
      }
    }
    
    // If that didn't work, try parsing as continuous string with field codes
    if (Object.keys(data).length === 0) {
      for (const [code, field] of Object.entries(this.fieldMapping)) {
        const regex = new RegExp(code + '([^A-Z]{3})*?(?=[A-Z]{3}|$)', 'g');
        const match = regex.exec(rawData);
        if (match && match[1]) {
          data[field] = match[1].trim();
        }
      }
    }
    
    // Format dates if present
    if (data.dateOfBirth) {
      data.dateOfBirth = this.formatDate(data.dateOfBirth);
    }
    if (data.expirationDate) {
      data.expirationDate = this.formatDate(data.expirationDate);
    }
    
    return data;
  }

  private formatDate(dateString: string): string {
    // Handle various date formats from different states
    if (dateString.length === 8) {
      // MMDDYYYY or YYYYMMDD format
      if (dateString.startsWith('19') || dateString.startsWith('20')) {
        // YYYYMMDD
        return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
      } else {
        // MMDDYYYY
        return `${dateString.slice(4, 8)}-${dateString.slice(0, 2)}-${dateString.slice(2, 4)}`;
      }
    }
    
    return dateString; // Return as-is if format is unknown
  }

  async preprocessImage(imageData: string): Promise<string> {
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return imageData;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Get image data for processing
      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      // Enhance contrast and convert to grayscale for better barcode detection
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Enhance contrast
        const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
        
        data[i] = enhanced;     // R
        data[i + 1] = enhanced; // G
        data[i + 2] = enhanced; // B
        // Alpha stays the same
      }

      // Put enhanced image data back
      ctx.putImageData(imageDataObj, 0, 0);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Image preprocessing failed, using original:', error);
      return imageData;
    }
  }
}

export const barcodeDecoder = new BarcodeDecoder();
