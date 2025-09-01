# YouTube Summarizer - React Landing Page

A modern React-based landing page for the YouTube Summarizer Chrome extension, featuring authentication, payment integration, and a beautiful user interface.

## 🚀 Features

- **Modern React Architecture** - Built with React 18, React Router, and Styled Components
- **Authentication System** - Google OAuth integration with JWT token management
- **Payment Integration** - Razorpay subscription management
- **Responsive Design** - Mobile-first responsive design with modern UI/UX
- **State Management** - Context API with custom hooks for auth and payments
- **Error Handling** - Comprehensive error boundaries and user feedback
- **Performance Optimized** - Lazy loading, code splitting, and optimized bundle size

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6, Styled Components
- **State Management**: React Context API, Custom Hooks
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios with interceptors
- **Build Tool**: Create React App
- **Styling**: Styled Components with responsive design

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Navigation/      # Navigation bar with auth states
│   ├── Footer/          # Footer component
│   ├── ErrorBoundary/   # Error handling component
│   ├── Hero/            # Hero section component
│   ├── Features/        # Features showcase component
│   └── Pricing/         # Pricing cards component
├── hooks/               # Custom React hooks
│   ├── useAuth.js       # Authentication state management
│   ├── usePayment.js    # Payment and subscription management
│   └── useBackend.js    # Backend API integration
├── services/            # API service layers
│   ├── authService.js   # Authentication API calls
│   ├── paymentService.js # Payment API calls
│   └── apiService.js    # Base API service with interceptors
├── pages/               # Page components
│   ├── HomePage.js      # Landing page
│   ├── PricingPage.js   # Pricing and subscription page
│   └── SignInPage.js    # Authentication page
├── styles/              # Global styles and themes
├── utils/               # Utility functions
├── App.js               # Main app component
└── index.js             # App entry point
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Running backend server (see `../backend/README.md`)
- Google OAuth credentials
- Razorpay account for payments

### Installation

1. **Navigate to the React project directory:**
   ```bash
   cd landing-page-react
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp config.template .env
   ```
   
   Update the `.env` file with your actual values:
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
   REACT_APP_RAZORPAY_KEY=rzp_test_your_key
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The optimized production build will be in the `build/` directory.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_API_URL` | Backend API base URL | Yes |
| `REACT_APP_GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `REACT_APP_RAZORPAY_KEY` | Razorpay public key | Yes |
| `REACT_APP_ENV` | Environment (development/production) | No |
| `REACT_APP_GA_TRACKING_ID` | Google Analytics tracking ID | No |

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized origins:
   - `http://localhost:3000` (development)
   - Your production domain

### Razorpay Setup

1. Sign up at [Razorpay](https://razorpay.com/)
2. Get your test/live API keys
3. Configure webhook endpoints for subscription events

## 📱 Features Overview

### Authentication Flow
- Google OAuth 2.0 integration
- JWT token management
- Automatic token refresh
- Extension communication for token sharing

### Payment System
- Razorpay subscription integration
- Multiple plan support (Free, Premium)
- Payment verification
- Subscription status tracking

### User Interface
- Modern, responsive design
- Smooth animations and transitions
- Loading states and error handling
- Accessible components

## 🔒 Security Features

- **HTTPS Only** - All external communications over HTTPS
- **JWT Token Management** - Secure token storage and refresh
- **CORS Configuration** - Proper cross-origin resource sharing
- **Input Validation** - Client-side form validation
- **Error Boundaries** - Graceful error handling

## 🚀 Deployment

### Development Deployment

```bash
# Start both backend and frontend
npm run dev
```

### Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to your hosting platform:**
   - **Vercel**: Connect GitHub repo and deploy
   - **Netlify**: Drag and drop build folder
   - **AWS S3 + CloudFront**: Upload build to S3
   - **Docker**: Use provided Dockerfile

### Environment-Specific Configurations

- **Development**: Hot reloading, detailed error messages
- **Production**: Optimized bundle, error reporting, analytics

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🔍 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App
- `npm run analyze` - Analyze bundle size

## 🤝 API Integration

The React app communicates with the backend API for:

- **Authentication**: `/api/auth/*`
- **Payments**: `/api/payment/*`
- **User Management**: `/api/user/*`
- **Analytics**: `/api/analytics/*`

### Error Handling

- Network errors with retry logic
- 401 Unauthorized → Redirect to sign-in
- 403 Forbidden → Show access denied
- 500 Server errors → Show retry option

## 📊 Performance Optimizations

- **Code Splitting** - Route-based lazy loading
- **Bundle Optimization** - Tree shaking and minification
- **Image Optimization** - WebP format and lazy loading
- **Caching** - Service worker for static assets
- **Preloading** - Critical resources preloaded

## 🐛 Troubleshooting

### Common Issues

1. **Google OAuth errors**:
   - Check client ID configuration
   - Verify authorized origins
   - Ensure HTTPS in production

2. **API connection errors**:
   - Verify backend server is running
   - Check CORS configuration
   - Validate API_URL environment variable

3. **Payment integration issues**:
   - Verify Razorpay key configuration
   - Check webhook endpoints
   - Validate subscription flow

### Debug Mode

Set `REACT_APP_ENV=development` to enable:
- Detailed error messages
- Console logging
- Development tools

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@youtubesummarizer.com
- 💬 Discord: [Join our community]
- 📚 Documentation: [Read the docs]

---

Built with ❤️ by the YouTube Summarizer team
