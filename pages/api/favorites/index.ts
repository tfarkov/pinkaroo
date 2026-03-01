/**
 * Serves /api/favorites (GET, POST, DELETE).
 * Re-exports the handler from favorites.ts so the route is at /api/favorites, not /api/favorites/favorites.
 */
export { default } from './favorites';
