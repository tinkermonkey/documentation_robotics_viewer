import { createRouter, createRoute, createRootRoute, Navigate } from '@tanstack/react-router';
import EmbeddedLayout from './EmbeddedLayout';
import ModelRoute from './routes/ModelRoute';
import SpecRoute from './routes/SpecRoute';
import MotivationRoute from './routes/MotivationRoute';
import ChangesetRoute from './routes/ChangesetRoute';

const rootRoute = createRootRoute({
  component: EmbeddedLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/model" />,
});

const modelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/model',
  component: () => <Navigate to="/model/graph" />,
});

const modelViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/model/$view',
  component: ModelRoute,
});

const specRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spec',
  component: () => <Navigate to="/spec/graph" />,
});

const specViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spec/$view',
  component: SpecRoute,
});

const motivationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/motivation',
  component: MotivationRoute,
});

const changesetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/changesets',
  component: () => <Navigate to="/changesets/graph" />,
});

const changesetsViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/changesets/$view',
  component: ChangesetRoute,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  modelRoute,
  modelViewRoute,
  specRoute,
  specViewRoute,
  motivationRoute,
  changesetsRoute,
  changesetsViewRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
