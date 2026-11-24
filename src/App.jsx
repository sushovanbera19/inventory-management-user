// The shop: providers around all pages.
import { StoreProviders } from '@/providers/StoreProviders'
import { StoreRoutes } from './routes.jsx'

export default function App() {
  return (
    <StoreProviders>
      <StoreRoutes />
    </StoreProviders>
  )
}
