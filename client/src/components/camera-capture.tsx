import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCamera } from '@/hooks/use-camera';
import { CameraIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CameraCaptureProps {
  onCapture: (frontImage: string, backImage: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'front' | 'back'>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { isActive, error, startCamera, stopCamera, captureImage, switchCamera, videoRef } = useCamera();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const imageData = captureImage();
    if (!imageData) return;

    if (captureMode === 'front') {
      setFrontImage(imageData);
      setCaptureMode('back');
    } else {
      setBackImage(imageData);
      setShowPreview(true);
    }
  };

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
      onCapture(frontImage, backImage);
    }
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setCaptureMode('front');
    setShowPreview(false);
  };

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
                
                {/* License Guide Overlay */}
                {isActive && !showPreview && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 flex items-center justify-center">
                      <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
                        Position {captureMode} of license within this area
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

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
                Process Images
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleCapture}
                disabled={!isActive}
                size="lg"
                className="bg-red-500 hover:bg-red-700 rounded-full px-8"
              >
                <CameraIcon className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                onClick={switchCamera}
                disabled={!isActive}
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
