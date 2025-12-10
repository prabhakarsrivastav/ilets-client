# Backend API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ielts-platform
JWT_SECRET=your-secret-key-change-in-production
```

3. Start MongoDB (make sure MongoDB is running)

4. Run development server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/health` - Health check

## Production Build

```bash
npm run build
npm start
```
