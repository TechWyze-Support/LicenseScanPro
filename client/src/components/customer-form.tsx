import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { insertCustomerSchema, type InsertCustomer } from '@shared/schema';
import { CheckCircleIcon, ArrowDownTrayIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CustomerFormProps {
  initialData?: Partial<InsertCustomer>;
  profilePhoto?: string;
  signature?: string;
  frontLicense?: string;
  backLicense?: string;
  barcode?: string;
  onSave?: (customer: any) => void;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }
];

export default function CustomerForm({ initialData, profilePhoto, signature, frontLicense, backLicense, barcode, onSave }: CustomerFormProps) {
  const [isDraft, setIsDraft] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ src: string; title: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      middleName: initialData?.middleName || '',
      dateOfBirth: initialData?.dateOfBirth || '',
      licenseNumber: initialData?.licenseNumber || '',
      licenseState: initialData?.licenseState || '',
      licenseExpiration: initialData?.licenseExpiration || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      zipCode: initialData?.zipCode || '',
      profilePhotoPath: initialData?.profilePhotoPath || '',
      signaturePath: initialData?.signaturePath || '',
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      const response = await apiRequest('POST', '/api/customers', data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Customer saved",
        description: `${data.firstName} ${data.lastName}'s profile has been successfully created.`,
      });
      onSave?.(data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save customer profile. Please try again.",
        variant: "destructive",
      });
      console.error('Failed to create customer:', error);
    },
  });

  const handleSubmit = (data: InsertCustomer) => {
    // Add profile photo and signature paths if available
    const customerData = {
      ...data,
      profilePhotoPath: profilePhoto ? 'profile-photo.jpg' : null,
      signaturePath: signature ? 'signature.jpg' : null,
    };

    createCustomerMutation.mutate(customerData);
  };

  const handleSaveDraft = () => {
    setIsDraft(true);
    // In a real app, you might save draft to localStorage or a draft API
    toast({
      title: "Draft saved",
      description: "Customer profile has been saved as draft.",
    });
  };

  return (
    <>
      <Card className="w-full max-w-6xl mx-auto shadow-material">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Customer Profile</CardTitle>
        <Badge variant="secondary" className="bg-green-100 text-green-700 flex items-center">
          <CheckCircleIcon className="h-4 w-4 mr-1" />
          Scan Complete
        </Badge>
      </CardHeader>

      <CardContent>
        {/* Crop Images Section */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Extracted Images</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Profile Photo */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Profile Photo</Label>
              <div className="bg-white rounded-lg p-3 text-center border">
                {profilePhoto ? (
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => setZoomImage({ src: profilePhoto, title: 'Profile Photo' })}
                  >
                    <img 
                      src={profilePhoto} 
                      alt="Customer profile photo" 
                      className="w-20 h-20 rounded-full mx-auto object-cover shadow-sm group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white bg-black bg-opacity-50 rounded-full p-1" />
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">No Photo</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Signature */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Signature</Label>
              <div className="bg-white rounded-lg p-3 h-24 flex items-center justify-center border">
                {signature ? (
                  <div 
                    className="relative cursor-pointer group h-full w-full flex items-center justify-center"
                    onClick={() => setZoomImage({ src: signature, title: 'Customer Signature' })}
                  >
                    <img 
                      src={signature} 
                      alt="Customer signature" 
                      className="h-8 max-w-full object-contain group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white bg-black bg-opacity-50 rounded-full p-1" />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">No Signature</span>
                )}
              </div>
            </div>
            
            {/* Front License */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Front License</Label>
              <div className="bg-white rounded-lg p-3 h-24 flex items-center justify-center border">
                {frontLicense ? (
                  <div 
                    className="relative cursor-pointer group h-full w-full flex items-center justify-center"
                    onClick={() => setZoomImage({ src: frontLicense, title: 'Front License' })}
                  >
                    <img 
                      src={frontLicense} 
                      alt="Front of license" 
                      className="max-h-full max-w-full object-contain rounded group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white bg-black bg-opacity-50 rounded-full p-1" />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">No Front</span>
                )}
              </div>
            </div>
            
            {/* Back License */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Back License</Label>
              <div className="bg-white rounded-lg p-3 h-24 flex items-center justify-center border">
                {backLicense ? (
                  <div 
                    className="relative cursor-pointer group h-full w-full flex items-center justify-center"
                    onClick={() => setZoomImage({ src: backLicense, title: 'Back License' })}
                  >
                    <img 
                      src={backLicense} 
                      alt="Back of license" 
                      className="max-h-full max-w-full object-contain rounded group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white bg-black bg-opacity-50 rounded-full p-1" />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">No Back</span>
                )}
              </div>
            </div>
            
            {/* Barcode */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Barcode</Label>
              <div className="bg-white rounded-lg p-3 h-24 flex items-center justify-center border">
                {barcode ? (
                  <div 
                    className="relative cursor-pointer group h-full w-full flex items-center justify-center"
                    onClick={() => setZoomImage({ src: barcode, title: 'License Barcode' })}
                  >
                    <img 
                      src={barcode} 
                      alt="License barcode" 
                      className="max-h-full max-w-full object-contain group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <MagnifyingGlassIcon className="h-6 w-6 text-white bg-black bg-opacity-50 rounded-full p-1" />
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-500 text-xs">No Barcode</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">

          {/* Customer Information Form */}
          <div className="lg:col-span-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* License Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="licenseState"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License State</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state.value} value={state.value}>
                                  {state.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="licenseExpiration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiration Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={handleSaveDraft}>
                    Save Draft
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCustomerMutation.isPending}
                    className="bg-blue-700 hover:bg-blue-900"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    {createCustomerMutation.isPending ? 'Saving...' : 'Save Customer'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Image Zoom Modal */}
    <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold flex items-center justify-between">
            {zoomImage?.title || 'Image'}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoomImage(null)}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          {zoomImage && (
            <div className="flex justify-center">
              <img
                src={zoomImage.src}
                alt={zoomImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
