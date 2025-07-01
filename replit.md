# replit.md

## Overview

This is a full-stack driver's license scanner application built with React, Node.js/Express, and PostgreSQL. The system provides a clean, minimalist interface for scanning driver's licenses using either camera capture or file upload, with PDF417 barcode decoding, face detection, and automatic customer profile creation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **File Handling**: Multer for multipart file uploads
- **Session Management**: Express sessions with PostgreSQL storage

### Database Architecture
- **Database**: PostgreSQL (configured via Drizzle with Neon serverless driver)
- **Schema**: Three main tables - customers, license_images, and scan_sessions
- **Migration**: Drizzle Kit for schema migrations

## Key Components

### Core Features
1. **Camera Capture**: Live camera interface for capturing license photos with visual guidance
2. **File Upload**: Drag-and-drop file upload with validation for JPEG, PNG, and PDF files
3. **Barcode Processing**: PDF417 barcode decoding for extracting license data
4. **Face Detection**: Automatic face cropping from license photos
5. **Customer Management**: Profile creation with auto-populated data from scanned licenses

### Frontend Components
- **CameraCapture**: Handles camera access and photo capture
- **FileUpload**: Manages file upload with progress tracking
- **CustomerForm**: Form component with validation for customer data entry
- **Header**: Navigation and branding component

### Backend Services
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **File Processing**: Multer configuration for handling license image uploads
- **API Routes**: RESTful endpoints for customers, stats, and file operations

## Data Flow

1. **License Scanning**:
   - User selects camera or upload mode
   - System captures/receives front and back images
   - Images are processed for barcode decoding and face detection
   - Extracted data populates customer form
   - User reviews and saves customer profile

2. **Data Processing Pipeline**:
   - Image upload → Barcode decoding → Face detection → Data extraction → Form population → Database storage

3. **Customer Management**:
   - Create new customers with extracted license data
   - Update existing customer profiles
   - View customer details and scan history

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **@heroicons/react**: Icon library
- **multer**: File upload handling

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Utility-first styling
- **PostCSS**: CSS processing

### Processing Libraries (Planned)
- **Sharp**: Image processing (referenced but not implemented)
- **face-api.js**: Face detection (mock implementation provided)
- **PDF417 decoder**: Barcode decoding (mock implementation provided)

## Deployment Strategy

### Development
- Vite development server with HMR
- Express server with middleware integration
- In-memory storage for development testing

### Production
- Vite build process generates optimized client bundle
- esbuild bundles server code for Node.js deployment
- PostgreSQL database with connection pooling
- Static file serving for uploaded images

### Environment Configuration
- DATABASE_URL for PostgreSQL connection
- File upload directory configuration
- Session management with secure cookies

## Changelog

- June 29, 2025. Initial setup
- June 29, 2025. Replaced license guide area with full-screen capture and 3-second countdown timer for optimal resolution
- June 29, 2025. Added camera selection dropdown and auto-shutter detection using edge detection algorithms
- December 29, 2025. Fixed barcode processing success/failure messaging to show accurate status
- December 29, 2025. Implemented precise photo and signature extraction using standard DL coordinates: photo (4.7%, 22%, 25.9%, 53.2%) and signature (4.7%, 76.2%, 25.9%, 11.9%)
- December 30, 2025. Replaced automatic edge detection with manual crop and skew tool for precise extraction of face, signature, front license, and back license with rotation correction
- December 30, 2025. Enhanced manual crop tool with immediate processing: crops each area individually upon completion, auto-advances to next crop type, and added barcode extraction for 5 total crop areas
- December 30, 2025. Fixed critical coordinate transformation bug in crop extraction: corrected scaling and rotation logic to properly map display canvas coordinates to actual image coordinates for accurate cropping
- December 30, 2025. Enhanced barcode decoding with high-contrast black and white preprocessing: added automatic image enhancement to convert barcode crops to pure black/white with sharpening filter for improved PDF417 recognition accuracy
- December 30, 2025. Added dedicated barcode scan mode: created specialized camera interface that continuously scans for PDF417 barcodes and automatically extracts license data when clearly detected, bypassing manual cropping for barcode-only scanning
- December 30, 2025. Enhanced barcode scanner with improved AAMVA parser and frame freezing: implemented proper AAMVA field parsing based on DL/ID headers, added camera selection controls, and freeze-frame functionality that captures the detected barcode for manual confirmation before data extraction
- December 30, 2025. Added image zoom popup functionality: implemented clickable extracted images in customer profile with modal dialog for detailed viewing, includes hover effects with magnifying glass icons and responsive zoom display for all five crop types
- December 30, 2025. Enhanced barcode processing with 8-color grayscale conversion: added quantized 8-level grayscale preprocessing (0, 36, 72, 108, 144, 180, 216, 255) to both manual crop tool and dedicated barcode scanner for optimized PDF417 barcode recognition with balanced contrast and detail preservation
- July 1, 2025. Added OCR functionality using OpenAI GPT-4o: integrated text extraction from license images to automatically populate form fields, using backend API to process images and merge OCR data with barcode data for comprehensive information extraction

## User Preferences

Preferred communication style: Simple, everyday language.