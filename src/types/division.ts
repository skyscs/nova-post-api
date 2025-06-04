export interface NovaPostApiResponse {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  items: NovaPostDivision[];
}

export interface NovaPostDivision {
  id: number;
  name: string;
  shortName: string;
  externalId: string;
  source: string;
  countryCode: string;
  settlement: {
    id: number;
    name: string;
    region: {
      id: number;
      name: string;
      parent?: {
        id: number;
        name: string;
      };
    };
  };
  address: string;
  displayAddress: string | null;
  number: string;
  status: string;
  customerServiceAvailable: boolean;
  divisionCategory: string;
  paymentEnabledDelivery: boolean;
  paymentEnabledPickup: boolean;
  publicPhones: string[];
  internalPhones: string[];
  responsiblePerson: string | null;
  partner: any | null;
  ownerDivision: {
    id: number;
    name: string;
  } | null;
  latitude: number;
  longitude: number;
  distance: number | null;
  longTermLocation: boolean;
  maxWeightPlaceSender: number;
  maxLengthPlaceSender: number;
  maxWidthPlaceSender: number;
  maxHeightPlaceSender: number;
  maxWeightPlaceRecipient: number;
  maxLengthPlaceRecipient: number;
  maxWidthPlaceRecipient: number;
  maxHeightPlaceRecipient: number;
  prohibitedSending: boolean;
  prohibitedIssuance: boolean;
  maxCostPlace: number;
  maxDeclaredCostPlace: number;
  workSchedule: WorkSchedule[];
  girthValue: number | null;
  girthFormula: string | null;
  settings: DivisionSetting[];
  logisticsCode: string | null;
  additionalIds: any[];
  photos: any[];
  attributes: any | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  fullAddress: {
    country: string;
    settlement: string;
    street: string;
    building: string;
    note: string;
    zipcode: string;
  };
}

export interface WorkSchedule {
  day: string;
  from: string;
  to: string;
  breakFrom: string | null;
  breakTo: string | null;
}

export interface DivisionSetting {
  id: number;
  divisionId: number;
  from: string;
  to: string;
  name: string;
  value: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Division {
  id: number;
  nova_id: number;
  name: string;
  short_name?: string;
  external_id?: string;
  source?: string;
  country_code: string;
  city_id?: number;
  address?: string;
  display_address?: string;
  number?: string;
  status?: string;
  customer_service_available: boolean;
  division_category?: string;
  payment_enabled_delivery: boolean;
  payment_enabled_pickup: boolean;
  responsible_person?: string;
  latitude: number;
  longitude: number;
  long_term_location: boolean;
  max_weight_place_sender?: number;
  max_length_place_sender?: number;
  max_width_place_sender?: number;
  max_height_place_sender?: number;
  max_weight_place_recipient?: number;
  max_length_place_recipient?: number;
  max_width_place_recipient?: number;
  max_height_place_recipient?: number;
  prohibited_sending: boolean;
  prohibited_issuance: boolean;
  max_cost_place?: number;
  max_declared_cost_place?: number;
  work_schedule?: any;
  full_address?: any;
  settings?: any;
  additional_ids?: any;
  photos?: any;
  attributes?: any;
  created_at: string;
  updated_at: string;
  nova_created_at?: string;
  nova_updated_at?: string;
  nova_deleted_at?: string;
  distance?: number;
}

export interface City {
  id: number;
  nova_id?: number;
  name: string;
  country_code: string;
  region_name?: string;
  parent_region_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Country {
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface GeospatialSearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  country?: string;
  category?: string;
  status?: string;
} 