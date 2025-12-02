import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'

const RootLayout = () => (
  <>
    <Outlet />
    <Toaster position="top-right" />
    <TanStackRouterDevtools />
  </>
)

export const Route = createRootRouteWithContext()({
  component: RootLayout,
})