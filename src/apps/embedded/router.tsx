import { createRouter, createRoute, createRootRoute, Navigate } from '@tanstack/react-router';
import { createHashHistory } from '@tanstack/history';
import EmbeddedLayout from './EmbeddedLayout';
import ModelRoute from './routes/ModelRoute';
import SpecRoute from './routes/SpecRoute';
import MotivationRoute from './routes/MotivationRoute';
import ArchitectureRoute from './routes/ArchitectureRoute';
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
  component: () => <Navigate to="/model/$view" params={{ view: 'graph' }} />,
});

const modelViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/model/$view',
  validateSearch: (search: any): { layer?: string } => {
    // Only extract layer from search, ignore other params like token which belong in page URL
    return {
      layer: typeof search.layer === 'string' ? search.layer : undefined,
    };
  },
  component: ModelRoute,
});

const specRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spec',
  component: () => <Navigate to="/spec/$view" params={{ view: 'graph' }} />,
});

const specViewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/spec/$view',
  component: SpecRoute,
});

const motivationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/motivation',
  validateSearch: (search: any): { selectedElement?: string; skipAnimation?: boolean } => {
    return {
      selectedElement: typeof search.selectedElement === 'string' ? search.selectedElement : undefined,
      skipAnimation: typeof search.skipAnimation === 'boolean' ? search.skipAnimation : false,
    };
  },
  component: MotivationRoute,
});

const architectureRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/architecture',
  validateSearch: (search: any): { selectedElement?: string; skipAnimation?: boolean } => {
    return {
      selectedElement: typeof search.selectedElement === 'string' ? search.selectedElement : undefined,
      skipAnimation: typeof search.skipAnimation === 'boolean' ? search.skipAnimation : false,
    };
  },
  component: ArchitectureRoute,
});

const changesetsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/changesets',
  component: () => <Navigate to="/changesets/$view" params={{ view: 'graph' }} />,
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
  architectureRoute,
  changesetsRoute,
  changesetsViewRoute,
]);

export const router = createRouter({ routeTree, history: createHashHistory() });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
