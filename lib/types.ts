/** Shared domain types for listings, favorites, and team/realtors */

export interface ListingBasic {
  id: string;
  title?: string;
  price?: number;
  location?: string;
  images?: string[];
  bedroomsTotal?: number;
  bathroomsTotal?: number;
  sizeSqm?: number;
  ecoRatingScore?: number | null;
}

export interface ListingWithCoords extends ListingBasic {
  latitude: number;
  longitude: number;
}

export interface FavoriteItem {
  id: string;
  listing?: {
    id: string;
    title?: string;
    price?: number;
    images?: string[];
  };
}

export interface RealtorTeamMember {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  availableHours?: string | null;
  role?: string;
  image?: string | null;
  bio?: string | null;
}
