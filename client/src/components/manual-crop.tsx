import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface ManualCropProps {
  frontImage: string;
  backImage: string;
  onCropsComplete: (crops: {
    face: string;
    signature: string;
    frontLicense: string;
    backLicense: string;
    barcode: string;
  }) => void;
  onClose: () => void;
}

type CropType = 'face' | 'signature' | 'frontLicense' | 'backLicense' | 'barcode';

export default function ManualCrop({ frontImage, backImage, onCropsComplete, onClose }: ManualCropProps) {
  const [currentCropType, setCurrentCropType] = useState<CropType>('face');
  const [currentImage, setCurrentImage] = useState<'front' | 'back'>('front');
  const [isDrawing, setIsDrawing] = useState(false);
  const [cropAreas, setCropAreas] = useState<Record<CropType, CropArea | null>>({
    face: null,
    signature: null,
    frontLicense: null,
    backLicense: null,
    barcode: null
  });
  const [completedCrops, setCompletedCrops] = useState<Record<CropType, string>>({
    face: '',
    signature: '',
    frontLicense: '',
    backLicense: '',
    barcode: ''
  });
  const [rotation, setRotation] = useState(0);
  const [tempCrop, setTempCrop] = useState<CropArea | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cropOrder: CropType[] = ['face', 'signature', 'frontLicense', 'backLicense', 'barcode'];

  const requiredImage = {
    face: 'front',
    signature: 'front',
    frontLicense: 'front',
    backLicense: 'back',
    barcode: 'back'
  };

  const advanceToNextCrop = () => {
    const currentIndex = cropOrder.indexOf(currentCropType);
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < cropOrder.length) {
      const nextCropType = cropOrder[nextIndex];
      setCurrentCropType(nextCropType);
      
      // Auto-switch to required image
      const required = requiredImage[nextCropType];
      if (currentImage !== required) {
        setCurrentImage(required as 'front' | 'back');
      }
    }
  };

  const drawImageOnCanvas = useCallback((image: HTMLImageElement, rotation: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const containerWidth = containerRef.current?.clientWidth || 800;
    const maxWidth = Math.min(containerWidth, 800);
    const scale = maxWidth / image.width;
    
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();

    // Draw all existing crop areas
    Object.entries(cropAreas).forEach(([type, area]) => {
      if (area) {
        drawCropArea(ctx, area, type as CropType, type === currentCropType);
      }
    });

    // Draw temporary crop area while dragging
    if (tempCrop && tempCrop.width > 0 && tempCrop.height > 0) {
      drawCropArea(ctx, tempCrop, currentCropType, true);
    }
  }, [cropAreas, currentCropType, tempCrop]);

  const drawCropArea = (ctx: CanvasRenderingContext2D, area: CropArea, type: CropType, isActive: boolean) => {
    const colors = {
      face: isActive ? '#ff0000' : '#ff4444',
      signature: isActive ? '#00ff00' : '#44ff44',
      frontLicense: isActive ? '#0066ff' : '#4488ff',
      backLicense: isActive ? '#ffaa00' : '#ffcc44',
      barcode: isActive ? '#ff00ff' : '#ff44ff'
    };

    // Ensure stroke properties are set correctly
    ctx.save();
    ctx.strokeStyle = colors[type];
    ctx.lineWidth = isActive ? 4 : 2;
    ctx.setLineDash(isActive ? [] : [8, 4]);
    ctx.globalAlpha = 1.0;
    
    // Draw crop rectangle with rotation
    ctx.translate(area.x + area.width / 2, area.y + area.height / 2);
    ctx.rotate((area.rotation * Math.PI) / 180);
    ctx.strokeRect(-area.width / 2, -area.height / 2, area.width, area.height);
    ctx.restore();

    // Draw label with background for better visibility
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const labelText = type.replace(/([A-Z])/g, ' $1').trim();
    const metrics = ctx.measureText(labelText);
    ctx.fillRect(area.x - 2, area.y - 18, metrics.width + 8, 16);
    
    ctx.fillStyle = colors[type];
    ctx.font = 'bold 12px Arial';
    ctx.fillText(labelText, area.x + 2, area.y - 6);
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setTempCrop({ x, y, width: 0, height: 0, rotation });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tempCrop) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const width = currentX - tempCrop.x;
    const height = currentY - tempCrop.y;

    setTempCrop({
      ...tempCrop,
      width: Math.abs(width),
      height: Math.abs(height),
      x: width < 0 ? currentX : tempCrop.x,
      y: height < 0 ? currentY : tempCrop.y
    });
  };

  const handleMouseUp = () => {
    if (tempCrop && tempCrop.width > 10 && tempCrop.height > 10) {
      // Immediately process this crop
      const currentImg = new Image();
      currentImg.onload = () => {
        const croppedImage = extractCrop(currentImg, tempCrop);
        
        // Store the completed crop
        setCropAreas(prev => ({
          ...prev,
          [currentCropType]: tempCrop
        }));
        
        // Store the processed crop image
        setCompletedCrops((prev: Record<CropType, string>) => ({
          ...prev,
          [currentCropType]: croppedImage
        }));
        
        // Auto-advance to next crop type
        advanceToNextCrop();
      };
      currentImg.src = currentImage === 'front' ? frontImage : backImage;
    }
    setIsDrawing(false);
    setTempCrop(null);
  };

  const extractCrop = (image: HTMLImageElement, area: CropArea): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Scale factor from display to actual image
    const displayCanvas = canvasRef.current;
    if (!displayCanvas) return '';
    
    const scaleX = image.width / displayCanvas.width;
    const scaleY = image.height / displayCanvas.height;

    // Actual crop dimensions
    const actualX = area.x * scaleX;
    const actualY = area.y * scaleY;
    const actualWidth = area.width * scaleX;
    const actualHeight = area.height * scaleY;

    canvas.width = actualWidth;
    canvas.height = actualHeight;

    ctx.save();
    ctx.translate(actualWidth / 2, actualHeight / 2);
    ctx.rotate((area.rotation * Math.PI) / 180);
    ctx.drawImage(
      image,
      actualX - actualWidth / 2,
      actualY - actualHeight / 2,
      actualWidth,
      actualHeight,
      -actualWidth / 2,
      -actualHeight / 2,
      actualWidth,
      actualHeight
    );
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleComplete = () => {
    // Check if all crops are completed
    const allCropsCompleted = Object.values(completedCrops).every(crop => crop !== '');
    
    if (allCropsCompleted) {
      onCropsComplete(completedCrops);
    } else {
      // Show which crops are missing
      const missing = Object.entries(completedCrops)
        .filter(([, crop]) => crop === '')
        .map(([type]) => cropTypeLabels[type as CropType])
        .join(', ');
      alert(`Please complete all crops. Missing: ${missing}`);
    }
  };

  const loadImage = useCallback(() => {
    const img = new Image();
    img.onload = () => {
      drawImageOnCanvas(img, rotation);
    };
    img.src = currentImage === 'front' ? frontImage : backImage;
  }, [currentImage, frontImage, backImage, rotation, drawImageOnCanvas]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    if (imageRef.current) {
      drawImageOnCanvas(imageRef.current, rotation);
    }
  }, [drawImageOnCanvas, rotation, cropAreas, tempCrop, currentCropType, currentImage]);

  const cropTypeLabels = {
    face: 'Face Photo',
    signature: 'Signature',
    frontLicense: 'Front License',
    backLicense: 'Back License',
    barcode: 'Barcode'
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manual Crop & Skew Tool</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Crop Type:</label>
            <Select value={currentCropType} onValueChange={(value) => {
              setCurrentCropType(value as CropType);
              const required = requiredImage[value as CropType];
              if (currentImage !== required) {
                setCurrentImage(required as 'front' | 'back');
              }
            }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(cropTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label} {cropAreas[key as CropType] ? '✓' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Image:</label>
            <Select value={currentImage} onValueChange={(value) => setCurrentImage(value as 'front' | 'back')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front">Front</SelectItem>
                <SelectItem value="back">Back</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Rotation:</label>
            <input
              type="range"
              min="-45"
              max="45"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm w-12">{rotation}°</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation(0)}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          <p className="font-medium">Instructions:</p>
          <p>• Currently cropping: <span className="font-medium text-blue-700">{cropTypeLabels[currentCropType]}</span></p>
          <p>• Click and drag to select the area, then release to process</p>
          <p>• Auto-advances to next crop type when completed</p>
          <p>• Adjust rotation if needed to correct skew</p>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="border border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full cursor-crosshair"
            style={{ display: 'block' }}
          />
        </div>

        {/* Progress */}
        <div className="grid grid-cols-5 gap-2 text-sm">
          {Object.entries(cropTypeLabels).map(([key, label]) => (
            <div
              key={key}
              className={`p-2 text-center rounded border-2 ${
                completedCrops[key as CropType] 
                  ? 'bg-green-100 text-green-800 border-green-300' 
                  : key === currentCropType
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {label} {completedCrops[key as CropType] ? '✓' : key === currentCropType ? '→' : '○'}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setCropAreas({
                face: null,
                signature: null,
                frontLicense: null,
                backLicense: null,
                barcode: null
              });
              setCompletedCrops({
                face: '',
                signature: '',
                frontLicense: '',
                backLicense: '',
                barcode: ''
              });
              setCurrentCropType('face');
              setCurrentImage('front');
            }}
          >
            Clear All
          </Button>
          
          <Button
            onClick={handleComplete}
            disabled={!cropAreas.face || !cropAreas.signature}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Complete Cropping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}