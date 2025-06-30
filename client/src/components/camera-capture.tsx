import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCamera } from '@/hooks/use-camera';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ManualCrop from './manual-crop';

interface CameraCaptureProps {
  onCapture: (frontImage: string, backImage: string) => void;
  onClose: () => void;
}

interface CroppedImages {
  face: string;
  signature: string;
  frontLicense: string;
  backLicense: string;
  barcode: string;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showManualCrop, setShowManualCrop] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [autoShutterEnabled, setAutoShutterEnabled] = useState(true);
  
  const { isActive, error, startCamera, stopCamera, captureImage, videoRef, availableDevices, currentDeviceId, selectCamera } = useCamera();

  const startCountdown = () => {
    if (isCountingDown) return;
    
    setIsCountingDown(true);
    setCountdown(3);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            const imageData = captureImage();
            if (imageData) {
              if (captureMode === 'front') {
                setFrontImage(imageData);
                setCaptureMode('back');
              } else {
                setBackImage(imageData);
                setShowPreview(true);
              }
            }
            setCountdown(null);
            setIsCountingDown(false);
          }, 100);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Auto-shutter detection
  useEffect(() => {
    if (!autoShutterEnabled || !isActive || showPreview || isCountingDown) return;

    const detectLicenseInFrame = () => {
      if (!videoRef.current) return;

      // Check if video has valid dimensions before processing
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
        return; // Skip processing if video dimensions aren't ready
      }

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple edge detection to check if license-like rectangle fills most of the frame
      let edgeCount = 0;
      const threshold = 50;
      const sampleRate = 4; // Check every 4th pixel for performance

      for (let i = 0; i < data.length; i += 4 * sampleRate) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Simple edge detection based on luminance changes
        if (i > 4 * sampleRate) {
          const prevR = data[i - 4 * sampleRate];
          const prevG = data[i - 3 * sampleRate];
          const prevB = data[i - 2 * sampleRate];
          const prevLuminance = 0.299 * prevR + 0.587 * prevG + 0.114 * prevB;
          
          if (Math.abs(luminance - prevLuminance) > threshold) {
            edgeCount++;
          }
        }
      }

      // If we detect significant edges (suggesting a license card), trigger capture
      const edgeRatio = edgeCount / (data.length / (4 * sampleRate));
      if (edgeRatio > 0.15) { // Threshold for license detection
        console.log('License detected in frame, triggering auto-capture');
        startCountdown();
      }
    };

    const interval = setInterval(detectLicenseInFrame, 1000); // Check every second
    return () => clearInterval(interval);
  }, [autoShutterEnabled, isActive, showPreview, isCountingDown, startCountdown]);

  const handleRetake = () => {
    if (captureMode === 'front') {
      setFrontImage(null);
    } else {
      setBackImage(null);
    }
    setShowPreview(false);
  };

  const handleSubmit = () => {
    if (frontImage && backImage) {
      setShowManualCrop(true);
    }
  };

  const handleCropsComplete = (crops: CroppedImages) => {
    // Pass the cropped images to the parent component
    onCapture(crops.frontLicense, crops.backLicense);
    setShowManualCrop(false);
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setCaptureMode('front');
    setShowPreview(false);
  };

  if (showManualCrop && frontImage && backImage) {
    return (
      <ManualCrop
        frontImage={frontImage}
        backImage={backImage}
        onCropsComplete={handleCropsComplete}
        onClose={() => setShowManualCrop(false)}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Camera Capture</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <XMarkIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mode Selection */}
        <div className="flex space-x-2">
          <Button
            variant={captureMode === 'front' ? 'default' : 'outline'}
            onClick={() => setCaptureMode('front')}
            disabled={showPreview}
          >
            Front {frontImage && '✓'}
          </Button>
          <Button
            variant={captureMode === 'back' ? 'default' : 'outline'}
            onClick={() => setCaptureMode('back')}
            disabled={!frontImage || showPreview}
          >
            Back {backImage && '✓'}
          </Button>
        </div>

        {/* Camera Feed or Preview */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <div className="aspect-video flex items-center justify-center">
            {showPreview ? (
              <div className="grid grid-cols-2 gap-4 p-4 w-full">
                <div className="text-center">
                  <p className="text-white text-sm mb-2">Front</p>
                  {frontImage && (
                    <img 
                      src={frontImage} 
                      alt="Front of license"
                      className="w-full h-48 object-cover rounded border-2 border-white"
                    />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-white text-sm mb-2">Back</p>
                  {backImage && (
                    <img 
                      src={backImage} 
                      alt="Back of license"
                      className="w-full h-48 object-cover rounded border-2 border-white"
                    />
                  )}
                </div>
              </div>
            ) : (
              <>
                {isActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <CameraIcon className="h-16 w-16 mx-auto mb-2" />
                    <p>Camera feed will display here</p>
                  </div>
                )}
                
                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-white text-8xl font-bold">
                      {countdown}
                    </div>
                  </div>
                )}
                
                {/* Instruction Overlay */}
                {isActive && !showPreview && !isCountingDown && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                    <p className="text-white text-lg bg-black bg-opacity-70 px-4 py-2 rounded-lg">
                      Hold {captureMode} of license to fill screen - manual crop next
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Camera Selection */}
        {!showPreview && availableDevices.length > 1 && (
          <div className="mb-4">
            <Select value={currentDeviceId || ''} onValueChange={selectCamera}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select camera..." />
              </SelectTrigger>
              <SelectContent>
                {availableDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || 'Camera'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Auto-shutter Toggle */}
        {!showPreview && (
          <div className="mb-4 flex items-center justify-center space-x-2">
            <input
              type="checkbox"
              id="autoShutter"
              checked={autoShutterEnabled}
              onChange={(e) => setAutoShutterEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="autoShutter" className="text-sm">
              Auto-capture when license fills screen
            </label>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {showPreview ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
              <Button variant="outline" onClick={handleRetake}>
                Retake {captureMode}
              </Button>
              <Button onClick={handleSubmit} className="bg-blue-700 hover:bg-blue-900">
                Manual Crop & Extract
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  const imageData = captureImage();
                  if (imageData) {
                    if (captureMode === 'front') {
                      setFrontImage(imageData);
                      setCaptureMode('back');
                    } else {
                      setBackImage(imageData);
                      setShowPreview(true);
                    }
                  }
                }}
                disabled={!isActive || isCountingDown}
                size="lg"
                className="bg-red-500 hover:bg-red-700 rounded-full px-8"
              >
                <CameraIcon className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
