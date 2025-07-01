import OpenAI from "openai";

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
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    });
  }

  async extractTextFromLicense(imageData: string): Promise<OCRResult> {
    try {
      console.log('Starting OCR text extraction from license image...');
      
      // Remove data URL prefix if present
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert OCR system specialized in reading driver's licenses. Extract all visible text information from the license image and return it as structured JSON. 

Pay special attention to:
- Full name (first, middle, last)
- Date of birth (format as YYYY-MM-DD)
- License number
- Expiration date (format as YYYY-MM-DD)
- Address components (street, city, state, zip)
- Physical characteristics (gender, eye color, height, weight)
- License class and restrictions/endorsements

Return only valid JSON with these exact field names: firstName, lastName, middleName, dateOfBirth, licenseNumber, expirationDate, address, city, state, zipCode, gender, eyeColor, height, weight, restrictions, endorsements, class.

If a field is not clearly visible or readable, omit it from the response rather than guessing.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please extract all text information from this driver's license image and return it as structured JSON."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      console.log('Raw OCR response:', content);
      
      const extractedData = JSON.parse(content) as OCRData;
      
      // Post-process the extracted data
      this.postProcessData(extractedData);
      
      console.log('Processed OCR data:', extractedData);
      
      return {
        success: true,
        data: extractedData,
        confidence: 0.9 // OpenAI typically has high confidence
      };
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OCR error'
      };
    }
  }

  private postProcessData(data: OCRData): void {
    // Clean up and format extracted data
    if (data.firstName) {
      data.firstName = this.cleanName(data.firstName);
    }
    
    if (data.lastName) {
      data.lastName = this.cleanName(data.lastName);
    }
    
    if (data.middleName) {
      data.middleName = this.cleanName(data.middleName);
    }
    
    if (data.dateOfBirth) {
      data.dateOfBirth = this.formatDate(data.dateOfBirth);
    }
    
    if (data.expirationDate) {
      data.expirationDate = this.formatDate(data.expirationDate);
    }
    
    if (data.licenseNumber) {
      data.licenseNumber = data.licenseNumber.replace(/\s+/g, '').toUpperCase();
    }
    
    if (data.state) {
      data.state = data.state.toUpperCase();
    }
    
    if (data.zipCode) {
      data.zipCode = data.zipCode.replace(/\D/g, '');
    }
    
    if (data.gender) {
      data.gender = data.gender.toUpperCase();
      // Normalize gender values
      if (data.gender.startsWith('M')) data.gender = 'M';
      if (data.gender.startsWith('F')) data.gender = 'F';
    }
    
    if (data.eyeColor) {
      data.eyeColor = data.eyeColor.toUpperCase();
    }
  }

  private cleanName(name: string): string {
    return name.split(' ')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  private formatDate(dateString: string): string {
    // Try to parse various date formats and return YYYY-MM-DD
    try {
      // Remove any extra characters
      const cleaned = dateString.replace(/[^\d\/\-]/g, '');
      
      // Try different date formats
      let date: Date | null = null;
      
      // MM/DD/YYYY
      if (cleaned.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [month, day, year] = cleaned.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      // MM-DD-YYYY
      else if (cleaned.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [month, day, year] = cleaned.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      // YYYY-MM-DD (already correct format)
      else if (cleaned.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return cleaned;
      }
      // YYYY/MM/DD
      else if (cleaned.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
        return cleaned.replace(/\//g, '-');
      }
      
      if (date && !isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (error) {
      console.log('Date formatting failed:', error);
    }
    
    return dateString; // Return original if parsing fails
  }
}

export const ocrService = new OCRService();