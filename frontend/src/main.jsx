import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Admin from './pages/Admin.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rota do Site Público */}
        <Route path="/" element={<App />} />
        
        {/* Rota do Painel Administrativo */}
        <Route path="/admin" element={<Admin />} />
        
        {/* Fallback para o hash antigo por compatibilidade */}
        <Route path="/#admin" element={<Navigate to="/admin" replace />} />
        
        {/* Redirecionar qualquer outra rota para a home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
