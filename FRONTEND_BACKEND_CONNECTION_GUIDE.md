# Frontend-Backend Connection Guide

This guide explains how to connect and test the MathQuest frontend and backend applications.

## 🏗️ Architecture Overview

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Frontend      │ ◄──────────────► │   Backend       │
│   (React)       │                  │   (Spring Boot) │
│   Port: 3000    │                  │   Port: 8080    │
└─────────────────┘                  └─────────────────┘
         │                                    │
         │                                    │
         ▼                                    ▼
┌─────────────────┐                  ┌─────────────────┐
│   Browser       │                  │   Database      │
│   (Chrome/Firefox)│                 │   (MySQL)       │
└─────────────────┘                  └─────────────────┘
```

## 🚀 Quick Start

### 1. Start the Backend
```bash
cd mathquest-backend
./mvnw spring-boot:run
```
The backend will start on `http://localhost:8080`

### 2. Start the Frontend
```bash
cd mathquest-frontend
npm start
```
The frontend will start on `http://localhost:3000`

### 3. Test Connection
The frontend will automatically run connection tests on startup in development mode.

## 🔧 Configuration

### Backend Configuration

#### Database Setup
1. Install MySQL
2. Create database: `CREATE DATABASE db_mathquest;`
3. Update `application.properties` with your database credentials

#### Environment Variables (Production)
```bash
export DB_URL=jdbc:mysql://localhost:3306/db_mathquest
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export JWT_SECRET=your-256-bit-secret-key
export JWT_EXPIRATION=86400000
```

### Frontend Configuration

#### API Proxy
The frontend uses a proxy configuration in `package.json`:
```json
{
  "proxy": "http://localhost:8080"
}
```

#### Environment Variables
Create `.env` file in frontend root:
```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_GROQ_API_KEY=your-groq-api-key
```

## 🔗 API Endpoints

### Authentication
- `POST /auth/signin` - User login
- `POST /auth/signup` - User registration
- `GET /auth/verify` - Email verification
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset

### Games
- `GET /games/{id}` - Get game by ID
- `POST /games` - Create game (Teacher only)
- `POST /games/submit-score` - Submit game score (Student only)
- `GET /games/{id}/leaderboard` - Get game leaderboard

### Admin
- `GET /api/admin/settings/announcements` - Get announcements
- `POST /api/admin/settings/announcements` - Create announcement
- `PUT /api/admin/settings/announcements/{id}` - Update announcement
- `DELETE /api/admin/settings/announcements/{id}` - Delete announcement

## 🧪 Testing Connection

### Automatic Tests
The frontend runs automatic connection tests on startup:

```javascript
import { runStartupTests } from './utils/startupTest';

// Run tests
const results = await runStartupTests();
console.log('Connection test results:', results);
```

### Manual Testing

#### 1. Test Basic Connectivity
```bash
curl http://localhost:8080/
```

#### 2. Test Authentication
```bash
curl -X POST http://localhost:8080/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

#### 3. Test Protected Endpoint
```bash
curl http://localhost:8080/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend Connection Test
```javascript
import { testBasicConnectivity } from './utils/connectionTest';

const result = await testBasicConnectivity();
if (result.success) {
  console.log('✅ Backend is reachable');
} else {
  console.log('❌ Backend connection failed:', result.message);
}
```

## 🔒 Security Configuration

### CORS Setup
The backend is configured to allow requests from `http://localhost:3000`:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
    configuration.setAllowCredentials(true);
    return source;
}
```

### JWT Authentication
The frontend automatically includes JWT tokens in requests:

```javascript
// Automatic token inclusion via axios interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. CORS Errors
**Error**: `Access to fetch at 'http://localhost:8080' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution**: 
- Check backend CORS configuration
- Ensure frontend is running on `http://localhost:3000`
- Verify backend is running on `http://localhost:8080`

#### 2. Connection Refused
**Error**: `ERR_CONNECTION_REFUSED`

**Solution**:
- Ensure backend is running: `./mvnw spring-boot:run`
- Check if port 8080 is available: `netstat -an | grep 8080`
- Verify firewall settings

#### 3. Authentication Errors
**Error**: `401 Unauthorized`

**Solution**:
- Check if JWT token is valid
- Verify token is included in request headers
- Check token expiration

#### 4. Database Connection Errors
**Error**: `Could not connect to database`

**Solution**:
- Ensure MySQL is running
- Check database credentials in `application.properties`
- Verify database exists: `db_mathquest`

### Debug Mode

#### Backend Debug
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
./mvnw spring-boot:run
```

#### Frontend Debug
```javascript
// Enable API logging
localStorage.setItem('debug', 'true');
```

## 📊 Monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend health (if implemented)
curl http://localhost:3000/health
```

### Logs
- **Backend logs**: `logs/mathquest.log`
- **Frontend logs**: Browser console
- **Error logs**: `logs/mathquest-error.log`

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build for production
./mvnw clean package -Pprod

# Run with production profile
java -jar target/demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve with nginx or similar
serve -s build -l 3000
```

### Environment Variables (Production)
```bash
# Backend
export DB_URL=jdbc:mysql://prod-db:3306/db_mathquest
export JWT_SECRET=production-secret-key
export APP_BASE_URL=https://your-domain.com

# Frontend
export REACT_APP_API_URL=https://api.your-domain.com
```

## 📝 API Documentation

### Request/Response Examples

#### Login Request
```json
POST /auth/signin
{
  "username": "student1",
  "password": "password123"
}
```

#### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "type": "Bearer",
  "id": 1,
  "username": "student1",
  "email": "student1@example.com",
  "roles": ["ROLE_STUDENT"]
}
```

#### Game Score Submission
```json
POST /games/submit-score
{
  "gameId": 1,
  "score": 1500,
  "level": 3,
  "timeSpent": 120000,
  "levelAchieved": 3
}
```

## 🔄 Development Workflow

1. **Start Backend**: `./mvnw spring-boot:run`
2. **Start Frontend**: `npm start`
3. **Make Changes**: Edit code in either frontend or backend
4. **Test Changes**: Use browser or API testing tools
5. **Check Logs**: Monitor console and log files
6. **Debug Issues**: Use connection test utilities

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Run connection tests to identify issues
4. Verify configuration settings
5. Check network connectivity

The application is now fully connected and ready for development and production use!
