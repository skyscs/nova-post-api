// Re-export all types from division.ts
export * from './division';

export interface Division {
  id?: number;
  nova_id: string;
  name: string;
  country: string;
  country_code: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  working_hours?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface Country {
  id?: number;
  name: string;
  code: string;
  divisions_count: number;
  created_at?: Date;
}

export interface City {
  id?: number;
  name: string;
  country: string;
  country_code: string;
  divisions_count: number;
  created_at?: Date;
}

export interface UpdateLog {
  id?: number;
  status: 'started' | 'completed' | 'failed';
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