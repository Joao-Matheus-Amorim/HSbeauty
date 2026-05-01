import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const hash = window.location.hash

if (hash === '#admin') {
  import('./pages/Admin.jsx').then(({ default: Admin }) => {
    createRoot(document.getElementById('root')).render(
      <StrictMode><Admin /></StrictMode>
    )
  })
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode><App /></StrictMode>
  )
}
