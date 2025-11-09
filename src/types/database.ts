// Common database types
export interface AttendanceField {
  id: string;
  project_id: string;
  field_key: string;
  field_label: string;
  field_description: string;
  is_required: boolean;
  display_order: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceResponse {
  id: string;
  session_id: string;
  field_key: string;
  response: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportationSettings {
  id: string;
  project_id: string;
  supported_methods: string[];
  requires_receipt: boolean;
  receipt_deadline: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportationInfo {
  id: string;
  session_id: string;
  transportation_method: string;
  departure_location: string | null;
  departure_date: string | null;
  departure_time: string | null;
  arrival_location: string | null;
  arrival_date: string | null;
  arrival_time: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  train_number: string | null;
  seat_number: string | null;
  flight_number: string | null;
  airline: string | null;
  requires_reimbursement: boolean;
  estimated_cost: number | null;
  actual_cost: number | null;
  receipt_submitted: boolean;
  notes: string | null;
  receipt_file_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArrivalGuideSettings {
  id: string;
  project_id: string;
  venue_name: string;
  venue_address: string;
  venue_map_url: string | null;
  check_in_time: string | null;
  check_in_location: string | null;
  presentation_time: string | null;
  presentation_room: string | null;
  parking_info: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  emergency_contact: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}
