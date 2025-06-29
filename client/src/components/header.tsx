import { Link } from "wouter";
import { DocumentTextIcon, UserIcon } from "@heroicons/react/24/outline";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-700 mr-3" />
            <h1 className="text-xl font-semibold text-gray-900">License Scanner</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </Link>
            <Link href="/customers" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              Customers
            </Link>
            <button className="bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-900 transition-colors flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Account
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
