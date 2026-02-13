export const ROLES = ['USER', 'ADMIN', 'REALTOR', 'BROKER'] as const;
export type Role = typeof ROLES[number];
export const LISTING_STATUSES = ['ACTIVE', 'PENDING', 'APPROVED', 'REJECTED'] as const;
export type ListingStatus = typeof LISTING_STATUSES[number];
export const PROVINCES = [
  'ALBERTA', 'BRITISH_COLUMBIA', 'MANITOBA', 'NEW_BRUNSWICK', 'NEWFOUNDLAND_AND_LABRADOR',
  'NOVA_SCOTIA', 'ONTARIO', 'PRINCE_EDWARD_ISLAND', 'QUEBEC', 'SASKATCHEWAN',
  'NORTHWEST_TERRITORIES', 'NUNAVUT', 'YUKON'
] as const;
export type Province = typeof PROVINCES[number];
export const PROPERTY_TYPES = ['House', 'Condo', 'Townhouse', 'Apartment', 'Land'] as const;
export type PropertyType = typeof PROPERTY_TYPES[number];
/** CREA DDF StandardStatus values for MLS search (see CREA DDF API docs) */
export const MLS_STANDARD_STATUSES = ['Active', 'Sold', 'Pending', 'Expired', 'Withdrawn'] as const;
export type MLSStandardStatus = typeof MLS_STANDARD_STATUSES[number];
export const SQFT_CONVERSION_FACTOR = 10.7639;
export const DEFAULT_LOCATION = { lat: 44.3894, lng: -79.6903 }; // Barrie, ON
export const CLIENT_STATUSES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'] as const;
export type ClientStatus = typeof CLIENT_STATUSES[number];
export const NOTIFICATION_TYPES = ['APPROVAL', 'INTERACTION', 'SYSTEM'] as const;
export type NotificationType = typeof NOTIFICATION_TYPES[number];
export const MAX_FAVORITES = 100; // Limit for indexedDB
export const REVENUE_MONTHS = 12; // For charts

// ——— API routes ———
export const API = {
  LISTINGS: '/api/listings',
  LISTINGS_PUBLIC: '/api/listings/public',
  LISTINGS_NEARBY: '/api/listings/nearby',
  FAVORITES: '/api/favorites',
  NOTIFICATIONS: '/api/notifications',
  CLIENTS: '/api/clients',
  CLIENTS_INTERACTIONS: '/api/clients/interactions',
  USERS: '/api/users',
  REALTORS: '/api/realtors',
  MLS_SEARCH: '/api/mls/search',
  ADMIN_REALTORS: '/api/admin/realtors',
  ADMIN_BROKERS: '/api/admin/brokers',
  ADMIN_ASSIGN_BROKER: '/api/admin/assign-broker',
  BROKER_STATS: '/api/broker/stats',
  BROKER_PENDING_LISTINGS: '/api/broker/pending-listings',
  BROKER_APPROVE_LISTING: '/api/broker/approve-listing',
} as const;

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
export const DEFAULT_NEARBY_RADIUS_KM = 50;
export const KM_PER_DEGREE_APPROX = 111;

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
  NEARBY_LISTINGS_TITLE: 'Nearby Listings (within 50km)',
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
  ADMIN_DASHBOARD: 'Admin Dashboard',
  ASSIGN_REALTOR_TO_BROKER: 'Assign Realtor to Broker',
  ASSIGN: 'Assign',
  REALTORS_LIST: 'Realtors List',
  BROKERS_LIST: 'Brokers List',
  PENDING_APPROVALS: 'Pending Listing Approvals',
  CRM_TITLE: 'CRM - Client Management',
  ADD_CLIENT: 'Add Client',
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
  POSTAL_CODE: 'Postal Code',
  SIZE_SQM: 'Size (sqm)',
  FAVORITE: 'Favorite ❤️',
  SEARCH_CANADIAN_MLS: 'Search Canadian MLS Listings',
  WELCOME_NOTIFICATION: 'Welcome to Pinkaroo',
  NO_BIO: 'No bio available',
  VIEW: 'View',
} as const;

// ——— Content-Type headers ———
export const CONTENT_TYPE = {
  JSON: 'application/json',
  MULTIPART_FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
} as const;
