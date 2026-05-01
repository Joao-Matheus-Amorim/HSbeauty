@echo off
title HSBeauty Dev
echo.
echo  ==================================
echo   HSBeauty ^| Subindo Back + Front
echo  ==================================
echo.
echo  Backend  -^> http://localhost:3000
echo  Frontend -^> http://localhost:5173
echo  Admin    -^> http://localhost:5173/#admin
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] Instalando dependencias raiz...
  call npm install
)

if not exist "backend\node_modules" (
  echo [INFO] Instalando dependencias do backend...
  call npm install --prefix backend
)

if not exist "frontend\node_modules" (
  echo [INFO] Instalando dependencias do frontend...
  call npm install --prefix frontend
)

if not exist "backend\.env" (
  echo [INFO] Copiando backend/.env.example para backend/.env
  copy backend\.env.example backend\.env
  echo [AVISO] Edite backend\.env e preencha DATABASE_URL e JWT_SECRET antes de continuar!
  pause
)

if not exist "frontend\.env" (
  echo [INFO] Copiando frontend/.env.example para frontend/.env
  copy frontend\.env.example frontend\.env
)

npm run dev
