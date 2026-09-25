/* eslint-disable */
// This file is generated for the file-based TanStack Router tree.
// Keep it committed so Netlify can build the project without running the generator first.
import { Route as rootRoute } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AdminRouteImport } from './routes/admin'
import { Route as ProductsProductIdRouteImport } from './routes/products/$productId'

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

const routeTree = rootRoute.addChildren({
  IndexRoute,
  AdminRoute,
  ProductsProductIdRoute,
})

export { routeTree }
