import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';

const Admin = lazy(() => import('./pages/Admin.jsx'));
const CategoriaPage = lazy(() => import('./pages/CategoriaPage.jsx'));

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rota do Site Publico */}
      <Route path="/" element={<App />} />

      {/* Pagina de categoria (substitui o drawer) */}
      <Route path="/c/:categoriaId" element={<Suspense fallback={null}><CategoriaPage /></Suspense>} />

      {/* Rota do Painel Administrativo */}
      <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />

      {/* Fallback para o hash antigo por compatibilidade */}
      <Route path="/#admin" element={<Navigate to="/admin" replace />} />

      {/* Redirecionar qualquer outra rota para a home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
