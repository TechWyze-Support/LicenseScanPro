// PDF417 barcode decoder utilities
// Note: ZXing library has compatibility issues, implementing fallback with enhanced detection

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
  gender?: string;
  documentDiscriminator?: string;
  country?: string;
  nameSuffix?: string;
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

  async decodeBarcode(imageData: string): Promise<BarcodeDecodeResult> {
    try {
      console.log('Starting comprehensive barcode decode process...');
      
      // First, enhance the barcode image to high contrast black and white
      const enhancedImage = await this.enhanceBarcodeToBlackWhite(imageData);
      console.log('Enhanced barcode image to high contrast black and white');
      
      // Enhanced multi-strategy approach with both enhanced and original images
      const strategies = [
        () => this.tryZXingDecode(enhancedImage),
        () => this.tryZXingDecode(imageData),
        () => this.tryPreprocessedDecode(enhancedImage),
        () => this.tryCanvasBasedDecode(enhancedImage),
        () => this.tryAlternativeLibraries(enhancedImage),
        () => this.tryPreprocessedDecode(imageData),
        () => this.tryCanvasBasedDecode(imageData),
        () => this.tryAlternativeLibraries(imageData)
      ];

      for (let i = 0; i < strategies.length; i++) {
        try {
          console.log(`Trying decode strategy ${i + 1}/${strategies.length}...`);
          const result = await strategies[i]();
          if (result.success && result.data && Object.keys(result.data).length > 0) {
            console.log(`Strategy ${i + 1} succeeded with data:`, result.data);
            return result;
          }
        } catch (error) {
          console.log(`Strategy ${i + 1} failed:`, error);
        }
      }

      // If all strategies fail
      return {
        success: false,
        error: 'Could not decode PDF417 barcode from image. Please ensure the license barcode is clearly visible and try again.'
      };

    } catch (error) {
      console.error('Barcode decode error:', error);
      
      return {
        success: false,
        error: 'Could not decode PDF417 barcode from image. Please ensure the license barcode is clearly visible and try again.'
      };
    }
  }

  private async tryAlternativeLibraries(imageData: string): Promise<BarcodeDecodeResult> {
    console.log('Trying alternative barcode libraries...');
    
    // Try jsQR for QR codes (some states use QR codes)
    try {
      const jsQR = await import('jsqr');
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR.default(imageData2.data, imageData2.width, imageData2.height);

      if (code) {
        console.log('jsQR found code:', code.data);
        const parsedData = this.parseAAMVAData(code.data);
        
        if (Object.keys(parsedData).length > 0) {
          return {
            success: true,
            data: parsedData,
            confidence: 0.80
          };
        }
      }
    } catch (error) {
      console.log('jsQR failed:', error);
    }
    
    throw new Error('Alternative libraries failed');
  }



  private async tryZXingDecode(imageData: string): Promise<BarcodeDecodeResult> {
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageData;
      });

      console.log('Trying ZXing decode...');
      const result = await reader.decodeFromImageElement(img);
      
      if (result) {
        console.log('Raw barcode data:', result.getText());
        const parsedData = this.parseAAMVAData(result.getText());
        
        if (Object.keys(parsedData).length > 0) {
          return {
            success: true,
            data: parsedData,
            confidence: 0.95
          };
        }
      }
    } catch (error) {
      console.log('ZXing decode error:', error);
    }
    
    // Try Quagga as fallback
    return this.tryQuaggaDecode(imageData);
  }

  private async tryQuaggaDecode(imageData: string): Promise<BarcodeDecodeResult> {
    return new Promise((resolve) => {
      try {
        console.log('Trying Quagga decode...');
        
        const Quagga = require('quagga');
        
        // Create canvas for Quagga processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not available');

        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Get image data for Quagga
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          Quagga.decodeSingle({
            src: canvas.toDataURL(),
            numOfWorkers: 0,
            inputStream: {
              size: canvas.width && canvas.height ? Math.min(canvas.width, canvas.height) : 800,
            },
            decoder: {
              readers: ['pdf417_reader', 'code_128_reader', 'code_39_reader']
            },
            locate: true,
            locator: {
              patchSize: 'medium',
              halfSample: true
            }
          }, (result: any) => {
            if (result && result.codeResult) {
              console.log('Quagga raw barcode data:', result.codeResult.code);
              const parsedData = this.parseAAMVAData(result.codeResult.code);
              
              if (Object.keys(parsedData).length > 0) {
                resolve({
                  success: true,
                  data: parsedData,
                  confidence: 0.85
                });
                return;
              }
            }
            
            console.log('Quagga decode failed');
            resolve({
              success: false,
              error: 'Quagga decode failed'
            });
          });
        };
        
        img.onerror = () => {
          resolve({
            success: false,
            error: 'Image load failed'
          });
        };
        
        img.src = imageData;
        
      } catch (error) {
        console.log('Quagga setup error:', error);
        resolve({
          success: false,
          error: 'Quagga not available'
        });
      }
    });
  }

  private async tryPreprocessedDecode(imageData: string): Promise<BarcodeDecodeResult> {
    console.log('Trying preprocessed decode...');
    
    // Preprocess image for better barcode detection
    const preprocessedImage = await this.preprocessImage(imageData);
    return this.tryZXingDecode(preprocessedImage);
  }

  private async tryCanvasBasedDecode(imageData: string): Promise<BarcodeDecodeResult> {
    console.log('Trying canvas-based decode...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });

    // Resize and enhance image
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    
    // Apply image enhancement
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Convert back to data URL
    const enhancedImage = canvas.toDataURL('image/png');
    
    return this.tryZXingDecode(enhancedImage);
  }



  private parseAAMVAData(rawData: string): BarcodeData {
    const data: BarcodeData = {};
    
    console.log('Parsing AAMVA data from:', rawData.substring(0, 100) + '...');
    
    try {
      // Skip header up to "DL" or "ID"
      let start = -1;
      if (rawData.includes("DL")) {
        start = rawData.indexOf("DL");
      } else if (rawData.includes("ID")) {
        start = rawData.indexOf("ID");
      } else {
        console.warn('No DL/ID header found, trying to parse entire string');
        start = 0;
      }

      const payload = rawData.substring(start);
      console.log('Payload after header:', payload.substring(0, 100) + '...');

      // Enhanced AAMVA field codes mapping
      const aamvaFields: Record<string, keyof BarcodeData> = {
        "DAQ": "licenseNumber",
        "DCS": "lastName", 
        "DCT": "lastName", // Alternative
        "DAC": "firstName",
        "DAD": "middleName",
        "DBB": "dateOfBirth",
        "DBC": "gender",
        "DBA": "expirationDate", 
        "DAG": "address",
        "DAI": "city",
        "DAJ": "state",
        "DAK": "zipCode",
        "DCF": "documentDiscriminator",
        "DCG": "country",
        "DDE": "nameSuffix"
      };

      // Parse each field
      for (const [code, fieldName] of Object.entries(aamvaFields)) {
        const index = payload.indexOf(code);
        if (index !== -1) {
          // Find the next field code or end of string
          let nextIndex = payload.length;
          for (const otherCode of Object.keys(aamvaFields)) {
            if (otherCode !== code) {
              const otherIndex = payload.indexOf(otherCode, index + 3);
              if (otherIndex !== -1 && otherIndex < nextIndex) {
                nextIndex = otherIndex;
              }
            }
          }
          
          // Extract field value
          const value = payload.substring(index + 3, nextIndex).trim();
          if (value && value.length > 0) {
            data[fieldName] = value;
          }
        }
      }
      
      // Post-process the data
      this.postProcessData(data);
      
      console.log('Parsed AAMVA data:', data);
      
    } catch (error) {
      console.warn('AAMVA parsing error:', error);
    }
    
    return data;
  }

  private parseFieldCodes(rawData: string, data: BarcodeData): void {
    // Parse 3-letter field codes (DAC, DCS, etc.)
    for (const [code, field] of Object.entries(this.fieldMapping)) {
      const patterns = [
        new RegExp(`${code}([^\\x1E\\x1F\\x1D\\x0A\\x0D]+)`, 'g'), // With separators
        new RegExp(`${code}([A-Za-z\\s\\d\\.\\-]+?)(?=[A-Z]{3}|$)`, 'g'), // Until next field
        new RegExp(`${code}(.{1,50}?)\\x1E`, 'g') // With record separator
      ];
      
      for (const pattern of patterns) {
        const match = pattern.exec(rawData);
        if (match && match[1] && match[1].trim()) {
          data[field] = match[1].trim();
          break;
        }
      }
    }
  }

  private parseAlternativeFormat(rawData: string, data: BarcodeData): void {
    // Some states use different formats or delimiters
    const lines = rawData.split(/[\x1E\x1F\x1D\n\r]+/);
    
    for (const line of lines) {
      if (line.length < 4) continue;
      
      const code = line.substring(0, 3);
      const value = line.substring(3);
      
      if (this.fieldMapping[code] && value.trim()) {
        data[this.fieldMapping[code]] = value.trim();
      }
    }
  }

  private parseCommonPatterns(rawData: string, data: BarcodeData): void {
    // Fallback: Look for common patterns in the data
    const patterns = [
      { regex: /\b([A-Z]{2,20})\s+([A-Z]{2,20})\b/, firstName: 2, lastName: 1 }, // Last, First
      { regex: /\b(\d{8})\b/, field: 'dateOfBirth' }, // MMDDYYYY or YYYYMMDD
      { regex: /\b([A-Z]\d{7,15})\b/, field: 'licenseNumber' }, // License number pattern
      { regex: /\b([A-Z]{2})\s*\d{5}/, field: 'state' } // State code
    ];
    
    for (const pattern of patterns) {
      const match = rawData.match(pattern.regex);
      if (match) {
        if (pattern.firstName && pattern.lastName) {
          if (!data.firstName) data.firstName = match[pattern.firstName];
          if (!data.lastName) data.lastName = match[pattern.lastName];
        } else if (pattern.field && !data[pattern.field as keyof BarcodeData]) {
          data[pattern.field as keyof BarcodeData] = match[1];
        }
      }
    }
  }

  private postProcessData(data: BarcodeData): void {
    // Format dates
    if (data.dateOfBirth) {
      data.dateOfBirth = this.formatDate(data.dateOfBirth);
    }
    if (data.expirationDate) {
      data.expirationDate = this.formatDate(data.expirationDate);
    }
    
    // Clean up names
    if (data.firstName) {
      data.firstName = data.firstName.replace(/[^\w\s-']/g, '').trim();
    }
    if (data.lastName) {
      data.lastName = data.lastName.replace(/[^\w\s-']/g, '').trim();
    }
    
    // Validate and clean license number
    if (data.licenseNumber) {
      data.licenseNumber = data.licenseNumber.replace(/[^\w]/g, '');
    }
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

  async enhanceBarcodeToBlackWhite(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageData);
          return;
        }

        const img = new Image();
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageDataObj.data;

          // Convert to high contrast black and white
          for (let i = 0; i < data.length; i += 4) {
            // Calculate grayscale value
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            // Apply aggressive threshold for high contrast
            // Use adaptive threshold based on local contrast
            const threshold = 128; // Can be adjusted for different barcode types
            const value = gray > threshold ? 255 : 0;
            
            // Set all RGB channels to the same value (black or white)
            data[i] = value;     // Red
            data[i + 1] = value; // Green
            data[i + 2] = value; // Blue
            // Alpha channel stays the same
          }

          // Apply additional sharpening to enhance barcode lines
          const sharpenedData = this.applySharpenFilter(data, canvas.width, canvas.height);
          
          // Put enhanced image data back
          ctx.putImageData(new ImageData(sharpenedData, canvas.width, canvas.height), 0, 0);

          resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
          console.warn('Failed to load image for barcode enhancement');
          resolve(imageData);
        };

        img.src = imageData;
      } catch (error) {
        console.warn('Barcode enhancement failed, using original:', error);
        resolve(imageData);
      }
    });
  }

  private applySharpenFilter(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length);
    
    // Sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels only
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              sum += data[pixelIndex] * kernel[kernelIndex];
            }
          }
          
          const resultIndex = (y * width + x) * 4 + c;
          result[resultIndex] = Math.max(0, Math.min(255, sum));
        }
        
        // Copy alpha channel
        const alphaIndex = (y * width + x) * 4 + 3;
        result[alphaIndex] = data[alphaIndex];
      }
    }
    
    // Copy edges without filtering
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          for (let c = 0; c < 4; c++) {
            const index = (y * width + x) * 4 + c;
            result[index] = data[index];
          }
        }
      }
    }
    
    return result;
  }
}

export const barcodeDecoder = new BarcodeDecoder();
