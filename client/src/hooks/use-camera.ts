import { useState, useRef, useCallback } from 'react';

export interface CameraHook {
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => string | null;
  switchCamera: () => Promise<void>;
  selectCamera: (deviceId: string) => Promise<void>;
  availableDevices: MediaDeviceInfo[];
  currentDeviceId: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useCamera(): CameraHook {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      console.log('Starting camera...');
      
      // Get available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      console.log('Available video devices:', videoDevices);
      
      // If no device selected, prefer built-in camera over virtual cameras
      let selectedDeviceId = currentDeviceId;
      if (!selectedDeviceId && videoDevices.length > 0) {
        // Prefer FaceTime, built-in, or integrated cameras over virtual ones
        const preferredDevice = videoDevices.find(device => 
          device.label.toLowerCase().includes('facetime') ||
          device.label.toLowerCase().includes('built-in') ||
          device.label.toLowerCase().includes('integrated')
        );
        selectedDeviceId = preferredDevice?.deviceId || videoDevices[0].deviceId;
        setCurrentDeviceId(selectedDeviceId);
        console.log('Auto-selected preferred camera:', selectedDeviceId, preferredDevice?.label);
      }
      
      // Force switch to FaceTime camera if currently using OBS Virtual Camera
      if (selectedDeviceId && videoDevices.length > 1) {
        const currentDevice = videoDevices.find(d => d.deviceId === selectedDeviceId);
        if (currentDevice?.label.toLowerCase().includes('obs') || currentDevice?.label.toLowerCase().includes('virtual')) {
          const faceTimeDevice = videoDevices.find(device => 
            device.label.toLowerCase().includes('facetime')
          );
          if (faceTimeDevice) {
            selectedDeviceId = faceTimeDevice.deviceId;
            setCurrentDeviceId(selectedDeviceId);
            console.log('Switched from virtual camera to FaceTime:', selectedDeviceId);
          }
        }
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: selectedDeviceId ? undefined : 'environment'
        },
        audio: false
      };
      
      console.log('Camera constraints:', constraints);
      console.log('Selected device ID:', selectedDeviceId);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      console.log('Got media stream:', stream);
      console.log('Stream active:', stream.active);
      console.log('Video tracks:', stream.getVideoTracks());
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Set video srcObject');
        
        // Force video to play
        try {
          await videoRef.current.play();
          console.log('Video started playing');
        } catch (playError) {
          console.log('Video play error (expected):', playError);
        }
        
        // Wait for video to load
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
              resolve();
            };
            // Fallback timeout
            setTimeout(resolve, 2000);
          }
        });
      }
      
      setIsActive(true);
      console.log('Camera started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(errorMessage);
      console.error('Camera error:', err);
    }
  }, [currentDeviceId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !isActive) return null;
    
    // Check if video has valid dimensions
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    if (!videoWidth || !videoHeight || videoWidth === 0 || videoHeight === 0) {
      console.warn('Video dimensions not ready:', videoWidth, 'x', videoHeight);
      return null;
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return null;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    context.drawImage(videoRef.current, 0, 0);
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [isActive]);

  const switchCamera = useCallback(async () => {
    if (availableDevices.length <= 1) {
      console.log('No additional cameras to switch to');
      return;
    }
    
    console.log('Switching camera...');
    const currentIndex = availableDevices.findIndex(device => device.deviceId === currentDeviceId);
    const nextIndex = (currentIndex + 1) % availableDevices.length;
    const nextDevice = availableDevices[nextIndex];
    
    console.log('Switching from', currentDeviceId, 'to', nextDevice.deviceId, nextDevice.label);
    
    stopCamera();
    setCurrentDeviceId(nextDevice.deviceId);
    
    // Restart camera with new device
    setTimeout(() => {
      startCamera();
    }, 200);
  }, [availableDevices, currentDeviceId, stopCamera, startCamera]);

  const selectCamera = useCallback(async (deviceId: string) => {
    console.log('Selecting camera:', deviceId);
    
    if (deviceId === currentDeviceId) {
      console.log('Camera already selected');
      return;
    }
    
    // Stop current camera
    stopCamera();
    
    // Update device ID
    setCurrentDeviceId(deviceId);
    
    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Restart camera with selected device
    try {
      await startCamera();
      console.log('Successfully switched to camera:', deviceId);
    } catch (error) {
      console.error('Failed to switch camera:', error);
      setError('Failed to switch camera');
    }
  }, [currentDeviceId, stopCamera, startCamera]);

  return {
    isActive,
    error,
    startCamera,
    stopCamera,
    captureImage,
    switchCamera,
    selectCamera,
    availableDevices,
    currentDeviceId,
    videoRef
  };
}
