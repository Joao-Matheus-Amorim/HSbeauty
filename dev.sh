#!/usr/bin/env bash
# dev.sh — sobe backend e frontend em paralelo
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo
echo -e "${GREEN} ================================== ${NC}"
echo -e "${GREEN}  HSBeauty | Subindo Back + Front  ${NC}"
echo -e "${GREEN} ================================== ${NC}"
echo
echo -e "  Backend  -> ${YELLOW}http://localhost:3000${NC}"
echo -e "  Frontend -> ${YELLOW}http://localhost:5173${NC}"
echo -e "  Admin    -> ${YELLOW}http://localhost:5173/#admin${NC}"
echo

# Instala deps se necessario
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}[INFO] Instalando dependencias raiz...${NC}"
  npm install
fi

if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}[INFO] Instalando dependencias do backend...${NC}"
  npm install --prefix backend
fi

if [ ! -d "frontend/node_modules" ]; then
  echo -e "${YELLOW}[INFO] Instalando dependencias do frontend...${NC}"
  npm install --prefix frontend
fi

# Cria .env se nao existir
if [ ! -f "backend/.env" ]; then
  cp backend/.env.example backend/.env
  echo -e "${YELLOW}[AVISO] Criado backend/.env — edite DATABASE_URL e JWT_SECRET!${NC}"
fi

if [ ! -f "frontend/.env" ]; then
  cp frontend/.env.example frontend/.env
fi

npm run dev
