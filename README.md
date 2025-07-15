# Stray Dog Mapper

A mobile application for mapping and tracking stray dogs.

## Prerequisites

### For Docker Development
- Docker and Docker Compose
- Git

### For Local Development
- Node.js (LTS version)
- Python 3.8+
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

## Getting Started

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/30ps/stray-dog-mapper.git
```

2. Start the services:
```bash
docker-compose up --build
```

3. Access the services:
- Backend API: http://localhost:8000
- Expo dev server: http://localhost:19000
- Expo dev tools: http://localhost:19001
- React Native dev tools: http://localhost:19002

### Using Local Development

#### Backend Setup
1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r backend/requirements.txt
```

3. Run the backend:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Mobile App Setup
1. Install dependencies:
```bash
cd mobile
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Choose your platform:
- Press 'a' to open on Android
- Press 'i' to open on iOS
- Press 'w' to open on web

## Environment Variables

### Backend
- `SQLITE_DB_PATH`: Path to SQLite database file (default: in-memory)

### Mobile App
- `API_BASE_URL`: Base URL for API calls (default: http://localhost:8000)

## Project Structure
```
stray-dog-mapper/
├── backend/           # FastAPI backend
│   ├── app/          # Application code
│   │   ├── database.py # Database configuration
│   │   ├── main.py   # Main FastAPI app
│   │   ├── models.py # Database models
│   │   ├── schemas.py# Pydantic schemas
│   ├── requirements.txt
│   └── Dockerfile
├── mobile/           # React Native mobile app
│   ├── App.tsx      # Main app component
│   ├── package.json # Dependencies
│   ├── tsconfig.json # TypeScript configuration
│   ├── app.json # Expo configuration
│   ├── index.ts # Entry point
│   ├── metro.config.js # Metro bundler configuration
│   └── Dockerfile
└── docker-compose.yml
```

## Development Tips

1. **Backend Development**:
   - Use `--reload` flag for hot reloading
   - Database is stored in `data/db/straydogs.db`

2. **Mobile Development**:
   - Use `expo install` to add new dependencies
   - Use `expo start --clear` to clear the Metro bundler cache

3. **API Endpoints**:
   - POST `/add_dog`: Add a new dog
   - GET `/get_dogs`: Get all dogs
   - GET `/`: Health check endpoint

## Troubleshooting

### Common Issues

1. **Expo Development**:
   - If you encounter Android SDK issues, set `ANDROID_HOME`:
     ```bash
     export ANDROID_HOME=/path/to/android/sdk
     ```

2. **Docker Issues**:
   - If containers fail to start, check logs:
     ```bash
     docker-compose logs
     ```

3. **Database Issues**:
   - If database file is corrupted, delete `data/db/straydogs.db` and restart

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
