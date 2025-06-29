import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'wouter';
import Header from '@/components/header';
import CameraCapture from '@/components/camera-capture';
import FileUpload from '@/components/file-upload';
import CustomerForm from '@/components/customer-form';
import { 
  CameraIcon, 
  DocumentArrowUpIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { barcodeDecoder } from '@/lib/barcode-decoder';
import { faceDetectionService } from '@/lib/face-detection';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@shared/schema';

type ScanMode = 'none' | 'camera' | 'upload';
type ProcessingStep = 'idle' | 'uploading' | 'decoding' | 'extracting' | 'complete';

export default function Home() {
  const [scanMode, setScanMode] = useState<ScanMode>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  
  const { toast } = useToast();

  // Fetch today's stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats/today'],
  }) as { data: { scanned: number; failed: number; newCustomers: number } | undefined };

  // Fetch recent customers
  const { data: recentCustomers } = useQuery({
    queryKey: ['/api/customers/recent'],
  }) as { data: Customer[] | undefined };

  const handleCameraCapture = async (frontImage: string, backImage: string) => {
    await processImages(frontImage, backImage);
  };

  const handleFileUpload = async (frontFile: File | null, backFile: File | null) => {
    if (!frontFile && !backFile) return;

    const frontImage = frontFile ? await fileToDataURL(frontFile) : null;
    const backImage = backFile ? await fileToDataURL(backFile) : null;

    await processImages(frontImage, backImage);
  };

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  };

  const processImages = async (frontImage: string | null, backImage: string | null) => {
    setIsProcessing(true);
    setProcessingStep('uploading');
    setProcessingProgress(0);
    setScanMode('none');

    try {
      // Step 1: Upload images (simulate)
      setProcessingProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Decode barcode from back image
      setProcessingStep('decoding');
      setProcessingProgress(40);
      
      let barcodeData = null;
      if (backImage) {
        const result = await barcodeDecoder.decodeBarcode(backImage);
        if (result.success && result.data) {
          barcodeData = result.data;
          console.log('Barcode decoded successfully:', barcodeData);
        } else {
          console.warn('Barcode decoding failed:', result.error);
          toast({
            title: "Barcode not detected",
            description: "Could not read PDF417 barcode. You can manually enter the information.",
            variant: "default",
          });
        }
      }

      // Step 3: Extract face and signature
      setProcessingStep('extracting');
      setProcessingProgress(70);

      let extractedPhoto = null;
      let extractedSignature = null;

      if (frontImage) {
        // Extract face
        const faceResult = await faceDetectionService.detectAndCropFace(frontImage);
        if (faceResult.success) {
          extractedPhoto = faceResult.croppedImage;
        }

        // Extract signature
        const licenseState = barcodeData?.state || 'CA';
        const signatureResult = await faceDetectionService.extractSignature(frontImage, licenseState);
        if (signatureResult.success) {
          extractedSignature = signatureResult.croppedImage;
        }
      }

      // Step 4: Complete processing
      setProcessingStep('complete');
      setProcessingProgress(100);

      // Set results
      setExtractedData(barcodeData);
      setProfilePhoto(extractedPhoto ?? null);
      setSignature(extractedSignature ?? null);
      setShowCustomerForm(true);

      toast({
        title: "Processing complete",
        description: "License data has been successfully extracted.",
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: "Failed to process license images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('idle');
    }
  };

  const handleCustomerSaved = (customer: Customer) => {
    setShowCustomerForm(false);
    setExtractedData(null);
    setProfilePhoto(null);
    setSignature(null);
    setProcessingProgress(0);
    
    toast({
      title: "Customer saved successfully",
      description: `${customer.firstName} ${customer.lastName}'s profile has been created.`,
    });
  };

  const getProcessingMessage = () => {
    switch (processingStep) {
      case 'uploading':
        return 'Uploading license images...';
      case 'decoding':
        return 'Extracting barcode data...';
      case 'extracting':
        return 'Detecting face and extracting signature...';
      case 'complete':
        return 'Processing complete!';
      default:
        return 'Processing license images...';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (showCustomerForm) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CustomerForm
            initialData={extractedData}
            profilePhoto={profilePhoto || undefined}
            signature={signature || undefined}
            onSave={handleCustomerSaved}
          />
        </main>
      </div>
    );
  }

  if (scanMode === 'camera') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CameraCapture 
            onCapture={handleCameraCapture}
            onClose={() => setScanMode('none')}
          />
        </main>
      </div>
    );
  }

  if (scanMode === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FileUpload 
            onUpload={handleFileUpload}
            onClose={() => setScanMode('none')}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Scanner Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Scanner Options Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-material">
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Scan Driver's License</h2>
                <p className="text-gray-600 mb-6">Choose how you'd like to capture the license information</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Camera Scan Button */}
                  <Button
                    onClick={() => setScanMode('camera')}
                    disabled={isProcessing}
                    className="group relative bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-lg p-6 h-auto flex flex-col items-center transition-all duration-200 text-gray-900"
                    variant="outline"
                  >
                    <div className="bg-blue-700 text-white rounded-full p-3 mb-3 group-hover:bg-blue-900 transition-colors">
                      <CameraIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Camera Scan</h3>
                    <p className="text-sm text-gray-600 text-center">Use your device camera to capture the license</p>
                  </Button>

                  {/* File Upload Button */}
                  <Button
                    onClick={() => setScanMode('upload')}
                    disabled={isProcessing}
                    className="group relative bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 rounded-lg p-6 h-auto flex flex-col items-center transition-all duration-200 text-gray-900"
                    variant="outline"
                  >
                    <div className="bg-gray-600 text-white rounded-full p-3 mb-3 group-hover:bg-gray-700 transition-colors">
                      <DocumentArrowUpIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Upload License</h3>
                    <p className="text-sm text-gray-600 text-center">Upload photos of front and back of license</p>
                  </Button>
                </div>

                {/* Processing Status */}
                {isProcessing && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-3"></div>
                      <span className="text-sm font-medium text-blue-900">{getProcessingMessage()}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-blue-700 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Card */}
          <Card className="shadow-material">
            <CardHeader>
              <CardTitle className="text-lg">Today's Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-gray-600">Scanned</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{(stats as any)?.scanned || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-sm text-gray-600">Failed</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{(stats as any)?.failed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UsersIcon className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">New Customers</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">{(stats as any)?.newCustomers || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Customers */}
        <Card className="shadow-material">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Customers</CardTitle>
            <Button variant="ghost" className="text-blue-700 hover:text-blue-900 flex items-center">
              <EyeIcon className="h-4 w-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(recentCustomers as any) && (recentCustomers as any).length > 0 ? (
                    (recentCustomers as any).map((customer: Customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.firstName} {customer.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.licenseNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.licenseState}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(customer.createdAt!).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link href={`/customer/${customer.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No customers found. Start by scanning your first license!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
