// Edge detection and auto-cropping for driver's licenses

export interface EdgeDetectionResult {
  success: boolean;
  croppedImage?: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
  error?: string;
}

export class EdgeDetectionService {
  async detectAndCropLicense(imageData: string): Promise<EdgeDetectionResult> {
    try {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const result = this.processImage(img);
          resolve(result);
        };
        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image for edge detection'
          });
        };
        img.src = imageData;
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during edge detection'
      };
    }
  }

  private processImage(img: HTMLImageElement): EdgeDetectionResult {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return {
        success: false,
        error: 'Failed to create canvas context'
      };
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale and apply edge detection
    const grayscale = this.convertToGrayscale(data, canvas.width, canvas.height);
    const edges = this.detectEdges(grayscale, canvas.width, canvas.height);
    
    // Find the license rectangle bounds
    const bounds = this.findLicenseBounds(edges, canvas.width, canvas.height);
    
    if (!bounds) {
      return {
        success: false,
        error: 'Could not detect license edges clearly'
      };
    }

    // Crop the image to the detected bounds
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    
    if (!croppedCtx) {
      return {
        success: false,
        error: 'Failed to create cropped canvas context'
      };
    }

    croppedCanvas.width = bounds.width;
    croppedCanvas.height = bounds.height;
    
    croppedCtx.drawImage(
      img,
      bounds.x, bounds.y, bounds.width, bounds.height,
      0, 0, bounds.width, bounds.height
    );

    const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
    
    return {
      success: true,
      croppedImage,
      bounds,
      confidence: this.calculateConfidence(bounds, canvas.width, canvas.height)
    };
  }

  private convertToGrayscale(data: Uint8ClampedArray, width: number, height: number): number[] {
    const grayscale: number[] = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Using luminance formula for grayscale conversion
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      grayscale.push(gray);
    }
    
    return grayscale;
  }

  private detectEdges(grayscale: number[], width: number, height: number): number[] {
    const edges: number[] = new Array(grayscale.length).fill(0);
    
    // Sobel edge detection
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = grayscale[(y + ky) * width + (x + kx)];
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            gx += pixel * sobelX[kernelIndex];
            gy += pixel * sobelY[kernelIndex];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        edges[y * width + x] = magnitude > 50 ? 255 : 0; // Threshold for edge detection
      }
    }
    
    return edges;
  }

  private findLicenseBounds(edges: number[], width: number, height: number): {x: number, y: number, width: number, height: number} | null {
    // Find horizontal edges (top and bottom of license)
    const horizontalEdges = this.findHorizontalEdges(edges, width, height);
    const verticalEdges = this.findVerticalEdges(edges, width, height);
    
    if (horizontalEdges.length < 2 || verticalEdges.length < 2) {
      return null;
    }
    
    // Get the most prominent edges
    const topEdge = horizontalEdges[0];
    const bottomEdge = horizontalEdges[horizontalEdges.length - 1];
    const leftEdge = verticalEdges[0];
    const rightEdge = verticalEdges[verticalEdges.length - 1];
    
    // Validate that we have a reasonable rectangle
    const detectedWidth = rightEdge - leftEdge;
    const detectedHeight = bottomEdge - topEdge;
    
    // Driver's license aspect ratio is approximately 1.6:1
    const aspectRatio = detectedWidth / detectedHeight;
    
    if (aspectRatio < 1.3 || aspectRatio > 2.0) {
      return null; // Doesn't look like a license
    }
    
    // Add small padding to ensure we don't cut off edges
    const padding = Math.min(width, height) * 0.02;
    
    return {
      x: Math.max(0, leftEdge - padding),
      y: Math.max(0, topEdge - padding),
      width: Math.min(width - (leftEdge - padding), detectedWidth + 2 * padding),
      height: Math.min(height - (topEdge - padding), detectedHeight + 2 * padding)
    };
  }

  private findHorizontalEdges(edges: number[], width: number, height: number): number[] {
    const horizontalEdges: number[] = [];
    const threshold = width * 0.3; // At least 30% of the width should have edges
    
    for (let y = 0; y < height; y++) {
      let edgeCount = 0;
      for (let x = 0; x < width; x++) {
        if (edges[y * width + x] > 0) {
          edgeCount++;
        }
      }
      
      if (edgeCount > threshold) {
        horizontalEdges.push(y);
      }
    }
    
    return this.filterConsecutiveEdges(horizontalEdges);
  }

  private findVerticalEdges(edges: number[], width: number, height: number): number[] {
    const verticalEdges: number[] = [];
    const threshold = height * 0.3; // At least 30% of the height should have edges
    
    for (let x = 0; x < width; x++) {
      let edgeCount = 0;
      for (let y = 0; y < height; y++) {
        if (edges[y * width + x] > 0) {
          edgeCount++;
        }
      }
      
      if (edgeCount > threshold) {
        verticalEdges.push(x);
      }
    }
    
    return this.filterConsecutiveEdges(verticalEdges);
  }

  private filterConsecutiveEdges(edges: number[]): number[] {
    if (edges.length === 0) return [];
    
    const filtered: number[] = [];
    let currentGroup: number[] = [edges[0]];
    
    for (let i = 1; i < edges.length; i++) {
      if (edges[i] - edges[i - 1] <= 5) { // Group consecutive edges within 5 pixels
        currentGroup.push(edges[i]);
      } else {
        // Take the middle of the current group
        filtered.push(Math.round(currentGroup.reduce((a, b) => a + b) / currentGroup.length));
        currentGroup = [edges[i]];
      }
    }
    
    // Don't forget the last group
    filtered.push(Math.round(currentGroup.reduce((a, b) => a + b) / currentGroup.length));
    
    return filtered;
  }

  private calculateConfidence(bounds: {x: number, y: number, width: number, height: number}, imageWidth: number, imageHeight: number): number {
    const aspectRatio = bounds.width / bounds.height;
    const areaRatio = (bounds.width * bounds.height) / (imageWidth * imageHeight);
    
    // Ideal driver's license aspect ratio is ~1.6
    const aspectConfidence = Math.max(0, 1 - Math.abs(aspectRatio - 1.6) / 0.6);
    
    // License should take up a reasonable portion of the image
    const areaConfidence = areaRatio > 0.1 && areaRatio < 0.8 ? 1 : Math.max(0, 1 - Math.abs(areaRatio - 0.4) / 0.4);
    
    return (aspectConfidence + areaConfidence) / 2;
  }
}

export const edgeDetectionService = new EdgeDetectionService();