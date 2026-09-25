/* eslint-disable */
// This file is generated for the file-based TanStack Router tree.
// It is kept in the repository so Netlify can resolve the route tree during the build.
import { Route as rootRoute } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AdminRouteImport } from './routes/admin'
import { Route as ProductsProductIdRouteImport } from './routes/products/$productId'
import { Route as CheckoutSuccessRouteImport } from './routes/checkout/success'
import { Route as CheckoutCancelRouteImport } from './routes/checkout/cancel'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AdminRoute = AdminRouteImport.update({
  id: '/admin',
  path: '/admin',
  getParentRoute: () => rootRoute,
} as any)

const ProductsProductIdRoute = ProductsProductIdRouteImport.update({
  id: '/products/$productId',
  path: '/products/$productId',
  getParentRoute: () => rootRoute,
} as any)

const CheckoutSuccessRoute = CheckoutSuccessRouteImport.update({
  id: '/checkout/success',
  path: '/checkout/success',
  getParentRoute: () => rootRoute,
} as any)

const CheckoutCancelRoute = CheckoutCancelRouteImport.update({
  id: '/checkout/cancel',
  path: '/checkout/cancel',
  getParentRoute: () => rootRoute,
} as any)

const routeTree = rootRoute.addChildren({
  IndexRoute,
  AdminRoute,
  ProductsProductIdRoute,
  CheckoutSuccessRoute,
  CheckoutCancelRoute,
})

export { routeTree }
