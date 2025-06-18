# Hotel Booking System

A comprehensive full-stack hotel booking application built with React and Node.js, featuring real-time availability, secure authentication, and responsive design.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/hotel-booking-system)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/hotel-booking-system)

## 🏨 Features

### Frontend (React)
- **Responsive Design**: Mobile-first approach with optimized layouts for all devices
- **Progressive Web App**: Offline capabilities and app-like experience
- **Real-time Search**: Instant hotel search with filters and sorting
- **Booking Flow**: Complete booking process with progress tracking
- **User Dashboard**: Manage bookings, view history, and account settings
- **Authentication**: Secure login/register with Firebase Auth
- **Error Boundaries**: Graceful error handling and recovery
- **SEO Optimized**: Meta tags, structured data, and social sharing
- **Performance**: Code splitting, lazy loading, and caching

### Backend (Node.js)
- **RESTful API**: Comprehensive API with proper HTTP status codes
- **Firebase Integration**: Firestore database and authentication
- **Security**: JWT tokens, input validation, rate limiting
- **Error Handling**: Centralized error management
- **Data Validation**: Joi schemas for request validation
- **Caching**: API response caching for improved performance
- **Backup & Migration**: Database backup and migration utilities
- **Documentation**: API documentation and deployment guides

## 🚀 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool with HMR
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Firebase** - Authentication and real-time database
- **React Helmet Async** - SEO and meta tag management
- **React Error Boundary** - Error handling
- **Workbox** - Service worker and PWA features

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Firebase Admin SDK** - Server-side Firebase integration
- **JWT** - JSON Web Tokens for authentication
- **Joi** - Data validation
- **bcryptjs** - Password hashing
- **Express Rate Limit** - API rate limiting
- **Helmet** - Security headers

### Database
- **Firestore** - NoSQL document database
- **Firebase Auth** - Authentication service
- **Firebase Storage** - File storage (for images)

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Firebase Project** with Firestore and Authentication enabled
- **Git** for version control

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/hotel-booking-system.git
cd hotel-booking-system/hotel-booking-app
```

### 2. Install Dependencies

#### Frontend
```bash
cd client
npm install
```

#### Backend
```bash
cd server
npm install
```

### 3. Environment Configuration

#### Frontend Environment Variables

Create environment files in the `client` directory:

```bash
# .env.development
cp client/.env.example client/.env.development
```

Update `client/.env.development`:
```env
VITE_APP_NAME=Hotel Booking System
VITE_APP_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase config
```

#### Backend Environment Variables

Create environment files in the `server` directory:

```bash
# .env.development
cp server/.env.example server/.env.development
```

Update `server/.env.development`:
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
CLIENT_URL=http://localhost:3000
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Generate a service account key for the backend
5. Configure Firebase security rules and indexes

#### Deploy Security Rules
```bash
cd server
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Start Backend Server
```bash
cd server
npm run dev
```
Server will run on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd client
npm run dev
```
Frontend will run on `http://localhost:3000`

#### Start Firebase Emulators (Optional)
```bash
cd server
npm run emulators:start
```
Emulator UI available at `http://localhost:4000`

### Production Build

#### Build Frontend
```bash
cd client
npm run build
```

#### Build and Start Backend
```bash
cd server
npm start
```

## 🚢 Deployment

### Option 1: Netlify + Railway (Recommended)

#### Frontend (Netlify)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy automatically on push to main branch

#### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Option 2: Full Stack on Railway

Deploy both frontend and backend on Railway using the provided configuration:

```bash
# Deploy to Railway
railway login
railway link
railway up
```

### Option 3: Docker Deployment

Build and run with Docker:

```bash
# Build and start all services
docker-compose up --build

# Production deployment
docker-compose -f docker-compose.prod.yml up --build
```

## 📁 Project Structure

```
hotel-booking-app/
├── client/                     # React frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context providers
│   │   ├── services/          # API and utility services
│   │   ├── styles/            # CSS stylesheets
│   │   └── utils/             # Helper functions
│   ├── netlify.toml           # Netlify configuration
│   ├── vite.config.js         # Vite configuration
│   └── package.json
├── server/                     # Node.js backend
│   ├── config/                # Configuration files
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Express middleware
│   ├── routes/                # API route definitions
│   ├── services/              # Business logic services
│   ├── schemas/               # Data validation schemas
│   ├── utils/                 # Utility functions
│   ├── railway.toml           # Railway configuration
│   └── package.json
├── docker-compose.yml         # Docker configuration
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Frontend Variables
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_ENABLE_ANALYTICS` - Enable Google Analytics
- `VITE_ENABLE_PWA` - Enable PWA features

#### Backend Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `JWT_SECRET` - JWT signing secret
- `FIREBASE_*` - Firebase Admin SDK configuration
- `CLIENT_URL` - Frontend URL for CORS

### Firebase Configuration

#### Security Rules
The application includes comprehensive Firestore security rules:
- Role-based access control
- Data validation
- User isolation
- Admin permissions

#### Database Indexes
Optimized indexes for:
- User queries by email and status
- Room availability searches
- Booking management
- Performance optimization

## 🧪 Testing

### Frontend Tests
```bash
cd client
npm test                    # Run tests
npm run test:coverage      # Run with coverage
```

### Backend Tests
```bash
cd server
npm test                    # Run tests
npm run test:coverage      # Run with coverage
```

### End-to-End Tests
```bash
npm run test:e2e           # Run E2E tests
```

## 📊 Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Components and images loaded on demand
- **Bundle Analysis**: `npm run analyze` to inspect bundle size
- **PWA Caching**: Service worker caches resources
- **Image Optimization**: WebP format with fallbacks

### Backend Optimizations
- **API Caching**: Redis caching for frequent queries
- **Database Indexing**: Optimized Firestore indexes
- **Compression**: Gzip compression for responses
- **Rate Limiting**: Prevents API abuse

## 🔒 Security Features

### Frontend Security
- **Content Security Policy**: Prevents XSS attacks
- **HTTPS Enforcement**: Secure connections only
- **Input Sanitization**: Client-side validation
- **Authentication State**: Secure token management

### Backend Security
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Joi schema validation
- **CORS Configuration**: Restricted origins
- **Security Headers**: Helmet.js protection

## 🐛 Troubleshooting

### Common Issues

#### Firebase Connection Issues
```bash
# Check Firebase configuration
firebase projects:list
firebase use your-project-id

# Test Firestore connection
firebase firestore:delete --all-collections --yes
```

#### Build Errors
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clean build directory
npm run clean
npm run build
```

#### CORS Errors
- Verify `CLIENT_URL` environment variable
- Check Firebase Auth domain configuration
- Ensure API base URL is correct

#### Performance Issues
```bash
# Analyze bundle size
npm run analyze

# Check for memory leaks
npm run build -- --profile
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token

### Room Endpoints
- `GET /api/rooms` - Get available rooms
- `GET /api/rooms/:id` - Get room details
- `GET /api/rooms/search` - Search rooms

### Booking Endpoints
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Firebase Team** - For the backend infrastructure
- **Vite Team** - For the lightning-fast build tool
- **Community** - For the open-source packages and resources

## 📞 Support

For support and questions:
- 📧 Email: support@hotelbooking.com
- 📞 Phone: +1-800-HOTELS
- 💬 Discord: [Join our community](https://discord.gg/hotelbooking)
- 📖 Documentation: [docs.hotelbooking.com](https://docs.hotelbooking.com)

---

Made with ❤️ by the Hotel Booking Team