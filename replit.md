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

## User Preferences

Preferred communication style: Simple, everyday language.