import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Link } from 'wouter';
import Header from '@/components/header';
import type { Customer } from '@shared/schema';

export default function CustomerProfile() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading, error } = useQuery<Customer>({
    queryKey: [`/api/customers/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                  <div className="lg:col-span-3 space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load customer profile. The customer may not exist or there was an error.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
          </div>
          <Button variant="outline" size="sm">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Customer Profile Card */}
        <Card className="shadow-material">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Customer Profile</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Active
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Profile Photo and Signature */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Profile Photo</h3>
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    {customer.profilePhotoPath ? (
                      <img 
                        src={`/uploads/${customer.profilePhotoPath}`}
                        alt="Customer profile photo" 
                        className="w-24 h-24 rounded-full mx-auto object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-2xl font-medium">
                          {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Signature</h3>
                  <div className="bg-gray-100 rounded-lg p-4 h-16 flex items-center justify-center">
                    {customer.signaturePath ? (
                      <img 
                        src={`/uploads/${customer.signaturePath}`}
                        alt="Customer signature" 
                        className="h-8 max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-500 text-xs">No Signature</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="lg:col-span-3">
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                        <p className="text-sm text-gray-900">{customer.firstName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                        <p className="text-sm text-gray-900">{customer.lastName}</p>
                      </div>
                      {customer.middleName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                          <p className="text-sm text-gray-900">{customer.middleName}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <p className="text-sm text-gray-900">{customer.dateOfBirth}</p>
                      </div>
                    </div>
                  </div>

                  {/* License Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                        <p className="text-sm text-gray-900 font-mono">{customer.licenseNumber}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License State</label>
                        <p className="text-sm text-gray-900">{customer.licenseState}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                        <p className="text-sm text-gray-900">{customer.licenseExpiration}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  {(customer.address || customer.city || customer.state || customer.zipCode) && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customer.address && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                            <p className="text-sm text-gray-900">{customer.address}</p>
                          </div>
                        )}
                        {customer.city && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <p className="text-sm text-gray-900">{customer.city}</p>
                          </div>
                        )}
                        {customer.state && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <p className="text-sm text-gray-900">{customer.state}</p>
                          </div>
                        )}
                        {customer.zipCode && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                            <p className="text-sm text-gray-900">{customer.zipCode}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Record Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                        <p className="text-sm text-gray-900">
                          {new Date(customer.createdAt!).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                        <p className="text-sm text-gray-900">
                          {new Date(customer.updatedAt!).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
