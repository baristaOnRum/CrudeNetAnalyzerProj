@echo off
echo ==========================================
echo  Building NetAnalyzer Standalone App
echo ==========================================

echo [1/4] Building Spring Boot Backend...
call gradlew.bat bootJar
if %errorlevel% neq 0 exit /b %errorlevel%

echo [2/4] Copying jar to frontend folder...
copy /Y build\libs\netAnalyzer-0.0.1-SNAPSHOT.jar frontend\backend.jar

echo [3/4] Building Vite Frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%

echo [4/4] Packaging Electron App...
call npm run electron:build
if %errorlevel% neq 0 exit /b %errorlevel%

echo ==========================================
echo  Build Complete! Check frontend/release
echo ==========================================
pause
