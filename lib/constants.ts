export const ROLES = ['USER', 'OFFICE_ADMIN', 'SYSTEM_ADMIN', 'REALTOR', 'BROKER'] as const;
export type Role = typeof ROLES[number];
export const LISTING_STATUSES = ['DRAFT', 'ACTIVE', 'PENDING', 'APPROVED', 'REJECTED'] as const;
export type ListingStatus = typeof LISTING_STATUSES[number];

/** Use these for broker approve/reject API — do not index into LISTING_STATUSES (order changes with enum). */
export const BROKER_LISTING_DECISION = { APPROVED: 'APPROVED', REJECTED: 'REJECTED' } as const;
export const PROVINCES = [
  'ALBERTA', 'BRITISH_COLUMBIA', 'MANITOBA', 'NEW_BRUNSWICK', 'NEWFOUNDLAND_AND_LABRADOR',
  'NOVA_SCOTIA', 'ONTARIO', 'PRINCE_EDWARD_ISLAND', 'QUEBEC', 'SASKATCHEWAN',
  'NORTHWEST_TERRITORIES', 'NUNAVUT', 'YUKON'
] as const;
export type Province = typeof PROVINCES[number];
export const PROPERTY_TYPES = ['House', 'Condo', 'Townhouse', 'Apartment', 'Land'] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];

/** Filter dropdown options for price (value in cents not used; we use the number) */
export const FILTER_PRICE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '100000', label: '$100k' },
  { value: '200000', label: '$200k' },
  { value: '300000', label: '$300k' },
  { value: '500000', label: '$500k' },
  { value: '750000', label: '$750k' },
  { value: '1000000', label: '$1M' },
  { value: '1500000', label: '$1.5M' },
  { value: '2000000', label: '$2M' },
  { value: '2500000', label: '$2.5M' },
  { value: '3000000', label: '$3M' },
  { value: '5000000', label: '$5M+' },
] as const;

export const FILTER_BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
] as const;

export const FILTER_BATHROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
] as const;

/** CREA DDF StandardStatus values for MLS search (see CREA DDF API docs) */
export const MLS_STANDARD_STATUSES = ['Active', 'Sold', 'Pending', 'Expired', 'Withdrawn'] as const;
export type MLSStandardStatus = typeof MLS_STANDARD_STATUSES[number];
export const SQFT_CONVERSION_FACTOR = 10.7639;
export const DEFAULT_LOCATION = { lat: 44.3894, lng: -79.6903 }; // Barrie, ON
export const CLIENT_STATUSES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'] as const;
export type ClientStatus = typeof CLIENT_STATUSES[number];
export const INTERACTION_TYPES = ['Call', 'Email', 'Meeting', 'Showing', 'Document', 'Other'] as const;
export const NOTIFICATION_TYPES = ['APPROVAL', 'INTERACTION', 'SYSTEM'] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];
export const MAX_FAVORITES = 100; // Limit for indexedDB and anonymous localStorage
export const ANONYMOUS_FAVORITES_KEY = 'pinkaroo_anonymous_favorites';
export const REVENUE_MONTHS = 12; // For charts

// ——— API routes (must match pages/api/* file structure) ———
export const API = {
  LISTINGS: '/api/listings',                    // GET/POST/PUT/DELETE (auth); single listing: /api/listings/[id]
  LISTINGS_PUBLIC: '/api/listings/public',      // GET paginated public listings (no auth)
  LISTINGS_NEARBY: '/api/listings/nearby',      // GET by lat/lng/radius (no auth)
  FAVORITES: '/api/favorites',                  // GET/POST/DELETE (auth); index.ts re-exports handler
  SAVED_SEARCHES: '/api/saved-searches',        // GET list / POST create (auth); PATCH/DELETE /api/saved-searches/[id]
  NOTIFICATIONS: '/api/notifications',          // GET/POST/PUT (auth)
  CLIENTS: '/api/clients',                      // CRUD; single: /api/clients/[id]
  CLIENTS_INTERACTIONS: '/api/clients/interactions',
  CLIENTS_STATS: '/api/clients/stats',           // Aggregated stats for CRM charts
  USERS: '/api/users',                          // Single user: GET/PUT /api/users/[id] (auth)
  REALTORS: '/api/realtors',                    // Single realtor: GET /api/realtors/[id] (public)
  REALTORS_PINKAROO: '/api/realtors/pinkaroo',  // GET Pinkaroo team (public)
  MLS_SEARCH: '/api/mls/search',
  ADMIN_REALTORS: '/api/admin/realtors',
  ADMIN_BROKERS: '/api/admin/brokers',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_ASSIGN_BROKER: '/api/admin/assign-broker',
  ADMIN_WEEKLY_KPIS: '/api/admin/weekly-kpis',
  BROKER_STATS: '/api/broker/stats',
  BROKER_WEEKLY_KPIS: '/api/broker/weekly-kpis',
  BROKER_PENDING_LISTINGS: '/api/broker/pending-listings',
  BROKER_APPROVE_LISTING: '/api/broker/approve-listing',
  BROKER_TEAMS: '/api/broker/teams',            // List: index; single: /api/broker/teams/[id]
  BROKER_REALTOR_DASHBOARD: '/api/broker/realtor-dashboard',
  BROKER_PERFORMANCE: '/api/broker/performance',
  BROKER_WORKLOAD: '/api/broker/workload',
  BROKER_CLIENT_OVERSIGHT: '/api/broker/client-oversight',
  BROKER_COMMS: '/api/broker/comms',
  BROKER_ADMIN_CONTROLS: '/api/broker/admin-controls',
  SYSTEM_ADMIN_SETTINGS: '/api/system-admin/settings',
  SYSTEM_ADMIN_PERMISSIONS: '/api/system-admin/permissions',
  SYSTEM_ADMIN_AUDIT: '/api/system-admin/audit',
  OFFICE_ADMIN_AWAITING_MLS: '/api/office-admin/awaiting-mls',
} as const;

/** Base path for the listing detail page (pages/listings/[id].tsx). */
export const LISTING_PAGE_PATH = '/listings';

/**
 * Build URL for the listing detail page. Returns null if id is missing or invalid so callers can avoid linking to /listings/undefined.
 */
export function getListingPageUrl(id: string | undefined | null): string | null {
  if (id == null || typeof id !== 'string' || !id.trim()) return null;
  return `${LISTING_PAGE_PATH}/${encodeURIComponent(id.trim())}`;
}

/** Home dashboard URL for a role (brokers/admins use dedicated hubs, not `/dashboard`). */
export function getPrimaryDashboardHref(role: string | undefined | null): string {
  switch (role) {
    case 'BROKER':
      return '/dashboard/broker';
    case 'OFFICE_ADMIN':
      return '/dashboard/office-admin';
    case 'SYSTEM_ADMIN':
      return '/dashboard/system-admin';
    default:
      return '/dashboard';
  }
}

// ——— HTTP / API messages ———
export const API_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  ALREADY_FAVORITED: 'Already favorited',
  LAT_LNG_REQUIRED: 'lat and lng required',
  USER_NOT_FOUND: 'User not found',
} as const;

// ——— App config ———
export const ADMIN_EMAIL = 'admin@example.com';
export const DEFAULT_PROVINCE = 'ONTARIO';
export const DEFAULT_BROKER_ID = 'default-broker-id';
export const IDB_NAME = 'pinkaroo';
export const IDB_VERSION = 1;
export const RECENTLY_VIEWED_LIMIT = 20;
/** Default radius (km) for nearby listings; haversine filter. Client falls back to Barrie, ON when geolocation is unavailable. */
export const DEFAULT_NEARBY_RADIUS_KM = 50;
/** Radius (km) for the single "pool" fetch; pins are then filtered client-side by zoom. */
export const NEARBY_POOL_RADIUS_KM = 120;
export const KM_PER_DEGREE_APPROX = 111;

/** Message shown when Google Maps API key is not set (maps on home, listing form, listing detail). */
export const MAP_NO_KEY_MESSAGE = 'Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)';

// ——— Cache & timing ———
export const STALE_TIME_5_MIN = 5 * 60 * 1000;
export const DEBOUNCE_MS = 300;

// ——— Google Analytics categories / actions ———
export const GA = {
  LISTING: 'Listing',
  LISTING_CREATED: 'Created',
  GEOCODING: 'Geocoding',
  GEOCODING_SUCCESS: 'Success',
  GEOCODING_FAILURE: 'Failure',
  MLS: 'MLS',
  MLS_SEARCH: 'Search',
  MLS_IMPORT_SUCCESS: 'Import Success',
  MLS_IMPORT_FAILURE: 'Import Failure',
  MLS_IMPORT_ATTEMPT: 'Import Attempt',
} as const;

// ——— Notification / socket messages ———
export const NOTIFICATION_MESSAGES = {
  ASSIGNED_TO_BROKER: 'Assigned to new broker',
  NEW_LISTING_PENDING: 'New listing pending approval',
  NEW_CLIENT_ADDED: 'New client added',
  LISTING_STATUS_UPDATED: 'Listing status updated',
  LISTING_APPROVED_AWAITING_MLS: (title: string, id: string) =>
    `Listing approved — file on MLS outside the app: "${title}" (${id.slice(0, 8)}…). It will appear on the site after MLS sync.`,
  YOUR_LISTING_STATUS: (status: string) => `Your listing has been ${status}`,
} as const;

// ——— Email subjects (MLS) ———
export const EMAIL_SUBJECTS = {
  MLS_TOKEN_ERROR: 'MLS Token Error',
  MLS_SEARCH_ERROR: 'MLS Search Error',
  MLS_SYNC_ERROR: 'MLS Sync Error',
} as const;

// ——— UI copy ———
export const UI = {
  WELCOME_TITLE: 'Welcome to Pinkaroo Real Estate Portal',
  NEARBY_LISTINGS_TITLE: 'Nearby Listings',
  LISTINGS_TITLE: 'Listings',
  FEATURED_LISTINGS_TITLE: 'Browse Listings',
  RECENTLY_VIEWED_TITLE: 'Recently Viewed',
  VIEW_LISTING: 'View Listing',
  VIEW_DETAILS: 'View Details',
  NO_NOTIFICATIONS: 'No notifications',
  NOTIFICATIONS: 'Notifications',
  PROFILE: 'Profile',
  DASHBOARD: 'Dashboard',
  ROLE: 'Role',
  NAME: 'Name',
  FILTERS: 'Filters',
  SUBMIT: 'Submit',
  IMPORT_TO_MY_LISTINGS: 'Import to My Listings',
  IMAGE_OF_MLS_LISTING: 'Image of MLS listing',
  SEARCHING_MLS: 'Searching MLS...',
  LOADING_MORE: 'Loading more...',
  LOADING: 'Loading...',
  ACCESS_DENIED: 'Access Denied',
  ADMIN_DASHBOARD: 'System Admin Dashboard',
  OFFICE_ADMIN_DASHBOARD: 'Office Admin Dashboard',
  ASSIGN_REALTOR_TO_BROKER: 'Assign Realtor to Broker',
  ASSIGN: 'Assign',
  REALTORS_LIST: 'Realtors List',
  BROKERS_LIST: 'Brokers List',
  PENDING_APPROVALS: 'Pending Listing Approvals',
  CRM_TITLE: 'CRM - Client Management',
  ADD_CLIENT: 'Add Client',
  EDIT_CLIENT: 'Edit Client',
  DELETE_CLIENT: 'Delete Client',
  CLIENT_DETAILS: 'Client details',
  ADD_INTERACTION: 'Add Interaction',
  INTERACTION_TYPE: 'Type',
  INTERACTION_DETAILS: 'Details',
  INTERACTION_DATE: 'Date',
  NOTES: 'Notes',
  CLIENTS_LIST: 'Clients',
  NO_CLIENTS: 'No clients yet. Add your first client above.',
  CONFIRM_DELETE_CLIENT: 'Delete this client? This cannot be undone.',
  LISTINGS_PER_REALTOR: 'Listings per Realtor',
  CHART_APPROVED: 'Approved',
  CHART_PENDING: 'Pending',
  CHART_REJECTED: 'Rejected',
  ANY_PROVINCE: 'Any Province',
  ANY_TYPE: 'Any Type',
  MIN_PRICE: 'Min Price',
  MAX_PRICE: 'Max Price',
  BEDROOMS: 'Bedrooms',
  BATHROOMS: 'Bathrooms',
  TITLE: 'Title',
  DESCRIPTION: 'Description',
  PRICE: 'Price',
  LOCATION: 'Location',
  CITY: 'City',
  POSTAL_CODE: 'Postal Code',
  SIZE_SQM: 'Size (sqm)',
  FAVORITE: 'Favorite ❤️',
  SEARCH_CANADIAN_MLS: 'Search Canadian MLS Listings',
  WELCOME_NOTIFICATION: 'Welcome to Pinkaroo',
  NO_BIO: 'No bio available',
  VIEW: 'View',
  EDIT_REALTOR_PROFILE: 'Edit Realtor Profile',
  BACK_TO_ADMIN: 'Back to Admin',
  EMAIL: 'Email',
  PHONE: 'Phone',
  AVAILABLE_HOURS: 'Available hours',
  BIO: 'Bio',
  PROFILE_IMAGE_URL: 'Profile image URL',
  BROKER: 'Broker',
  SAVE_PROFILE: 'Save profile',
  PROFILE_SAVED: 'Profile saved.',
  TEAM_LEAD: 'Team lead',
  TEAM_MANAGEMENT: 'Team management',
  BROKER_PERFORMANCE: 'Performance',
  BROKER_WORKLOAD: 'Workload',
  BROKER_CLIENT_OVERSIGHT: 'Client oversight',
  BROKER_COMMUNICATIONS: 'Communications',
  BROKER_ADMIN_CONTROLS: 'Admin controls',
  BROKER_TEAM_TITLE: 'Team – Realtors',
  BROKER_TEAM_DESCRIPTION: 'Manage your team and designate team leads. Team leads can edit realtor profiles within your team.',
  NO_TEAM_MEMBERS: 'No realtors in your team yet. Realtors are assigned to your team by an admin.',
  ADD_TEAM: 'Add team',
  TEAM_NAME: 'Team name',
  SAVE: 'Save',
  DELETE_TEAM: 'Delete team',
  ASSIGN_TO_TEAM: 'Assign to team',
  NO_TEAM: 'No team',
  SAVED_SEARCHES_TITLE: 'Saved searches',
  SAVE_THIS_SEARCH: 'Save this search',
  SAVED_SEARCH_NAME_LABEL: 'Search name',
  APPLY_SAVED_SEARCH: 'Apply',
  NOTIFY_NEW_MATCHES: 'In-app alerts for new matches',
  SIGN_IN_TO_SAVE_SEARCHES: 'Sign in to save searches and get in-app alerts when new listings match.',
  NEW_MATCHES_BADGE: 'New',
  DELETE_SAVED_SEARCH: 'Remove',
  SAVE_AS_DRAFT: 'Save as draft',
  SUBMIT_FOR_APPROVAL: 'Submit for approval',
  LISTING_DRAFT_BANNER: 'Draft — buyers cannot see this listing until you submit it for approval.',
  EDIT_DRAFT_LISTING: 'Edit draft',
  AWAITING_MLS_TITLE: 'Awaiting MLS filing',
  AWAITING_MLS_HELP:
    'These listings are broker-approved but not on the public site. File them on MLS outside Pinkaroo; they appear after MLS sync picks them up.',
} as const;

// ——— Content-Type headers ———
export const CONTENT_TYPE = {
  JSON: 'application/json',
  MULTIPART_FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
} as const;
