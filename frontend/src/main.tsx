import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DataObjectPage from './Screens/DataObjectPage.tsx'
import '../src/Styles/main.css'; // Add this import

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataObjectPage />
  </StrictMode>
)