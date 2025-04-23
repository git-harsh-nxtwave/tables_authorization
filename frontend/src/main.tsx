import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Form from './Screens/Form.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Form />
  </StrictMode>,
)
