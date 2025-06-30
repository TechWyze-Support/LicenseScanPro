import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XMarkIcon, PhotoIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';
import ManualCrop from './manual-crop';

interface FileUploadProps {
  onUpload: (frontImage: File | null, backImage: File | null, face?: string, signature?: string, barcode?: string) => void;
  onClose: () => void;
}

interface CroppedImages {
  face: string;
  signature: string;
  frontLicense: string;
  backLicense: string;
  barcode: string;
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<'front' | 'back' | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showManualCrop, setShowManualCrop] = useState(false);
  
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, or PDF files.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 10MB.');
      return false;
    }

    setError(null);
    return true;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File, side: 'front' | 'back') => {
    if (!validateFile(file)) return;

    const preview = await createPreview(file);
    
    if (side === 'front') {
      setFrontImage(file);
      setFrontPreview(preview);
    } else {
      setBackImage(file);
      setBackPreview(preview);
    }

    toast({
      title: "File uploaded",
      description: `${side} image uploaded successfully`,
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault();
    setIsDragging(side);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, side: 'front' | 'back') => {
    e.preventDefault();
    setIsDragging(null);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0], side);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0], side);
    }
  };

  const handleSubmit = async () => {
    if (!frontImage && !backImage) {
      setError('Please upload at least one image.');
      return;
    }

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Show manual crop tool if both images are available
    if (frontImage && backImage && frontPreview && backPreview) {
      setShowManualCrop(true);
    } else {
      onUpload(frontImage, backImage);
    }
  };

  const handleCropsComplete = (crops: CroppedImages) => {
    // Pass the cropped images to the parent component
    onUpload(frontImage, backImage, crops.face, crops.signature, crops.barcode);
    setShowManualCrop(false);
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setFrontPreview(null);
    setBackPreview(null);
    setUploadProgress(0);
    setError(null);
  };

  // Show manual crop tool if enabled
  if (showManualCrop && frontPreview && backPreview) {
    return (
      <ManualCrop
        frontImage={frontPreview}
        backImage={backPreview}
        onCropsComplete={handleCropsComplete}
        onClose={() => setShowManualCrop(false)}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upload License Images</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging === 'front' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-500'
            }`}
            onDragOver={(e) => handleDragOver(e, 'front')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'front')}
          >
            {frontPreview ? (
              <div className="space-y-2">
                <img 
                  src={frontPreview} 
                  alt="Front preview" 
                  className="w-full h-32 object-cover rounded border"
                />
                <p className="text-sm text-green-600">✓ Front image uploaded</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setFrontImage(null);
                    setFrontPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Front of License</h3>
                <p className="text-sm text-gray-600 mb-4">Drag and drop or click to upload</p>
                <Button 
                  className="bg-blue-700 hover:bg-blue-900"
                  onClick={() => document.getElementById('front-input')?.click()}
                >
                  Choose File
                </Button>
                <p className="text-xs text-gray-500 mt-2">JPEG, PNG up to 10MB</p>
                <input
                  id="front-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleInputChange(e, 'front')}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Back Upload */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragging === 'back' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-500'
            }`}
            onDragOver={(e) => handleDragOver(e, 'back')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'back')}
          >
            {backPreview ? (
              <div className="space-y-2">
                <img 
                  src={backPreview} 
                  alt="Back preview" 
                  className="w-full h-32 object-cover rounded border"
                />
                <p className="text-sm text-green-600">✓ Back image uploaded</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setBackImage(null);
                    setBackPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <>
                <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Back of License</h3>
                <p className="text-sm text-gray-600 mb-4">Drag and drop or click to upload</p>
                <Button 
                  className="bg-blue-700 hover:bg-blue-900"
                  onClick={() => document.getElementById('back-input')?.click()}
                >
                  Choose File
                </Button>
                <p className="text-xs text-gray-500 mt-2">JPEG, PNG up to 10MB</p>
                <input
                  id="back-input"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleInputChange(e, 'back')}
                  className="hidden"
                />
              </>
            )}
          </div>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uploading images...</span>
              <span className="text-sm text-gray-600">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={(!frontImage && !backImage) || (uploadProgress > 0 && uploadProgress < 100)}
            className="bg-blue-700 hover:bg-blue-900"
          >
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Process Images
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
