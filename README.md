# 📚 BookAdventure - Frontend Application

> A modern web application for library management built with Angular 18+ and DaisyUI

[![Angular](https://img.shields.io/badge/Angular-18+-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-4.x-green.svg)](https://daisyui.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-blue.svg)](https://tailwindcss.com/)

## 🚀 Key Features

- **🎯 Modern Architecture**: Angular 18+ with Standalone Components and Signals
- **🎨 Elegant UI/UX**: DaisyUI + TailwindCSS for responsive design
- **🔐 JWT Authentication**: Complete authentication and authorization system
- **🛡️ Error Handling**: Centralized interceptor with elegant notifications
- **📱 Responsive Design**: Optimized for mobile and desktop devices
- **⚡ Performance**: Lazy loading and performance optimizations

## 🛠️ Technology Stack

### Core Framework

- **Angular 18+**: Main framework with Standalone Components
- **TypeScript 5.6+**: Development language with static typing
- **RxJS**: Reactive programming for state and event management

### UI & Styling

- **DaisyUI 4.x**: Component system and themes
- **TailwindCSS 3.x**: CSS utility framework
- **SweetAlert2**: Elegant notifications and modals
- **CSS Variables**: Customizable themes

### Development Tools

- **Angular CLI**: Development and build tools
- **ESLint**: Code linting and analysis
- **Prettier**: Automatic code formatting

## 📁 Project Structure

```
src/
├── app/                           # Main app configuration
│   ├── app.config.ts             # Providers and interceptors configuration
│   ├── app.routes.ts             # Route definitions
│   └── app.html                  # Main template
│
├── core/                         # Core services and utilities
│   ├── guards/                   # Route guards (auth, admin)
│   ├── interceptors/             # HTTP Interceptors (JWT, Error handling)
│   ├── services/                 # Core services (Auth, Error handling)
│   └── utils/                    # HTTP utilities and helpers
│
├── features/                     # Feature modules
│   ├── home/                     # Home page and catalog
│   ├── login/                    # User authentication
│   ├── register/                 # New user registration
│   ├── my-account/               # Profile and rental management
│   │   ├── profile/              # User profile component
│   │   └── rentals/              # Rental orders component
│   ├── book-detail/              # Book details and rental
│   └── admin-panel/              # Administrative panel
│       ├── components/           # Admin components
│       ├── services/             # Administrative services
│       └── interfaces/           # Interfaces and types
│
├── layout/                       # Layout components
│   ├── navbar/                   # Navigation bar
│   └── footer/                   # Footer
│
├── shared/                       # Shared components
│   └── components/               # Reusable components
│
├── types/                        # TypeScript type definitions
│   ├── auth.ts                   # Authentication types
│   ├── book.ts                   # Book types
│   ├── error.ts                  # Error handling types
│   └── ...
│
└── environments/                 # Environment configurations
    ├── environment.ts            # Development
    └── environment.development.ts # Production
```

## 🔧 Setup and Installation

### Prerequisites

- **Node.js** 18+
- **npm** 9+ or **pnpm** 8+
- **Angular CLI** 18+

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd bookadventure-angular

# 2. Install dependencies
npm install
# or using pnpm
pnpm install

# 3. Configure environment variables
# Edit src/environments/environment.ts and environment.development.ts
```

### Environment Variables

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  baseUrl: "https://localhost:7094/api/",
  apiTimeout: 10000,
};
```

## 🚀 Development Scripts

```bash
# Development server
pnpm start
# or
ng serve

# Production build
pnpm run build
# or
ng build --configuration production

# Linting
pnpm run lint
# or
ng lint

# Unit tests
pnpm test
# or
ng test

# E2E tests
pnpm run e2e
# or
ng e2e
```

## 🎯 Features by Module

### 🏠 **Home** (`/`)

- **Book catalog**: Responsive grid with pagination
- **Filters**: By genre and text search
- **Detail view**: Complete book information
- **Rental system**: Integrated with authentication

### 🔐 **Authentication** (`/login`, `/register`)

- **Login**: JWT authentication
- **Registration**: New account creation
- **Session management**: Automatic tokens and refresh
- **Smart redirection**: Return to previous page

### 👤 **My Account** (`/my-account`)

- **User profile**: Personal data editing
- **Rental history**: Active and past orders
- **Return management**: Rented book status
- **Notifications**: Expiration alerts

### 📖 **Book Detail** (`/book/:id`)

- **Complete information**: Description, author, genre
- **Rental system**: Guided process
- **Availability**: Real-time status
- **Images**: Cover gallery

### ⚙️ **Admin Panel** (`/admin`)

- **Book management**: Complete CRUD
- **Genre management**: Categorization
- **Customer management**: User administration
- **Rental reports**: Analytics and statistics
- **Status**: Enable/disable elements

## 🛡️ Security System

### **JWT Authentication**

```typescript
// Automatic JWT interceptor
const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
```

### **Route Guards**

- **AuthGuard**: Protects routes requiring authentication
- **AdminGuard**: Restricts access to administrative features
- **RoleGuard**: Granular control by user roles

### **Error Interceptor**

```typescript
// Centralized HTTP error handling
- Status 401: Automatic session logout
- Status 403: Access denied notification
- Status 404: Resource not found message
- Status 500+: Server errors
- Network errors: Connectivity issues
```

## 🎨 Theme System

### **DaisyUI Themes**

```html
<!-- Automatic theme toggle -->
<html data-theme="dark">
  <!-- or "light" -->
</html>
```

### **Available Themes**

- **Light Theme**: Light theme with soft colors
- **Dark Theme**: Dark theme for better night experience
- **Auto Theme**: Automatic detection based on system preferences

## 📊 State Management

### **Signals (Angular 18+)**

```typescript
// Reactive state with Signals
export class AuthService {
  user = signal<User | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
}
```

### **Services Pattern**

- **AuthService**: Authentication management
- **UserProfileService**: User data
- **AdminService**: Administrative features
- **ErrorHandlingService**: Centralized error management

## 🔄 API Integration

### **Base Configuration**

```typescript
// HTTP base configuration
export const environment = {
  baseUrl: "https://localhost:7094/api/",
  apiTimeout: 10000,
};
```

### **Main Endpoints**

```typescript
// Authentication
POST /users/login
POST /users/register
POST /users/refresh-token

// Books
GET /books
GET /books/{id}
POST /books (Admin)
PUT /books/{id} (Admin)

// Rentals
GET /rentalorders/user
POST /rentalorders
PUT /rentalorders/{id}/return
```

## 🧪 Testing

### **Test Configuration**

```bash
# Unit tests with Karma/Jasmine
ng test

# E2E tests with Protractor/Cypress
ng e2e

# Coverage report
ng test --code-coverage
```

### **Testing Strategy**

- **Unit Tests**: Isolated services and components
- **Integration Tests**: Complete user flows
- **E2E Tests**: Critical use cases

## 📦 Build and Deployment

### **Production Build**

```bash
# Optimized build
ng build --configuration production

# Bundle analysis
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

### **Optimizations**

- **Lazy Loading**: Deferred module loading
- **Tree Shaking**: Elimination of unused code
- **AOT Compilation**: Ahead-of-time compilation
- **Service Workers**: Cache and offline functionality

## 🐛 Debugging and Development

### **Chrome DevTools**

- **Angular DevTools**: Extension for debugging
- **Redux DevTools**: For state management
- **Network Tab**: HTTP request monitoring

### **Development Logs**

```typescript
// Error interceptor with detailed logging
console.group("🚨 HTTP Error Intercepted");
console.error("Error Context:", errorContext);
console.error("Full Error:", error);
console.groupEnd();
```

## 🚀 Performance

### **Implemented Optimizations**

- **OnPush Change Detection**: Reduction of detection cycles
- **Lazy Loading**: On-demand module loading
- **Image Optimization**: Compression and modern formats
- **Bundle Splitting**: Code division by routes

### **Target Metrics**

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: < 500KB gzipped

## 📱 Responsive Design

### **Breakpoints**

```css
/* Tailwind/DaisyUI breakpoints */
sm: 640px    /* Phones */
md: 768px    /* Tablets */
lg: 1024px   /* Laptops */
xl: 1280px   /* Desktops */
2xl: 1536px  /* Large screens */
```

### **Responsive Components**

- **Navbar**: Hamburger menu on mobile
- **Grid System**: Automatic adaptive layout
- **Modals**: Fullscreen on small devices
- **Tables**: Horizontal scroll on small screens

## 🤝 Contributing

### **Code Standards**

```bash
# Automatic linting
pnpm run lint
pnpm run lint:fix

# Prettier formatting
pnpm run format
```

### **Conventions**

- **Naming**: PascalCase for components, camelCase for methods
- **Files**: kebab-case for file names
- **Commits**: Conventional Commits format
- **Branches**: feature/feature-name

## 📄 License

This project is under the MIT license. See the `LICENSE` file for more details.

---
