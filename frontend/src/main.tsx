import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import DataObjectPage from './Screens/DataObjectPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataObjectPage />
  </StrictMode>
)