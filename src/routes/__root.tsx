import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'
import { CallProvider } from '@/contexts/CallContext'

const RootLayout = () => (
  <CallProvider>
    <Outlet />
    <Toaster position="top-right" />
    <TanStackRouterDevtools />
  </CallProvider>
)

export const Route = createRootRouteWithContext()({
  component: RootLayout,
})