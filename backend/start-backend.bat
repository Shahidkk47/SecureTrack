@echo off
cd /d "%~dp0"

echo Creating .env file...
(
echo DB_HOST=ep-young-haze-b59klri0-pooler.c-7.us-east-2.aws.neon.tech
echo DB_PORT=5432
echo DB_USER=neondb_owner
echo DB_PASSWORD=npg_noi2PgDUtp6j
echo DB_NAME=neondb
echo JWT_SECRET=mySecretKey12345
echo PORT=3000
) > .env

echo .env created.
echo.
echo Installing packages, please wait...
call npm install

echo.
echo Starting backend server...
echo Look for: "SecureTrack backend listening on port 3000"
echo Keep this window open while demoing.
echo.
call npm run dev

pause
