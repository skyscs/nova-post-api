// Re-export all types from division.ts
export * from './division';

export interface Division {
  id?: number;
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
  customer_service_available?: boolean;
  division_category?: string;
  payment_enabled_delivery?: boolean;
  payment_enabled_pickup?: boolean;
  responsible_person?: string;
  latitude?: number;
  longitude?: number;
  long_term_location?: boolean;
  max_weight_place_sender?: number;
  max_length_place_sender?: number;
  max_width_place_sender?: number;
  max_height_place_sender?: number;
  max_weight_place_recipient?: number;
  max_length_place_recipient?: number;
  max_width_place_recipient?: number;
  max_height_place_recipient?: number;
  prohibited_sending?: boolean;
  prohibited_issuance?: boolean;
  max_cost_place?: number;
  max_declared_cost_place?: number;
  work_schedule?: any;
  full_address?: any;
  settings?: any;
  additional_ids?: any;
  photos?: any;
  attributes?: any;
  nova_created_at?: Date;
  nova_updated_at?: Date;
  nova_deleted_at?: Date;
}

export interface Country {
  code: string;
  name: string;
  divisions_count: number;
}

export interface City {
  id?: number;
  nova_id?: number;
  name: string;
  country_code: string;
  region_name?: string;
  parent_region_name?: string;
  divisions_count: number;
}

export interface UpdateLog {
  id?: number;
  status: 'started' | 'completed' | 'failed' | 'running';
  message?: string;
  divisions_count?: number;
  started_at: Date;
  completed_at?: Date;
  error_details?: string;
}

export interface SearchParams {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  country?: string;
  city?: string;
  limit?: number;
  offset?: number;
}

export interface NearbyDivision extends Division {
  distance?: number; // in kilometers
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface NovaPostApiResponse {
  base_version: {
    unix_time: number;
    url: string;
  };
  deltas: Array<{
    unix_time_from: number;
    unix_time_till: number;
    url: string;
  }>;
} 