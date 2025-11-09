export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      arrival_guide_settings: {
        Row: {
          additional_notes: string | null
          check_in_location: string | null
          check_in_time: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          emergency_contact: string | null
          id: string
          parking_info: string | null
          presentation_room: string | null
          presentation_time: string | null
          project_id: string
          updated_at: string
          venue_address: string
          venue_map_url: string | null
          venue_name: string
        }
        Insert: {
          additional_notes?: string | null
          check_in_location?: string | null
          check_in_time?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          emergency_contact?: string | null
          id?: string
          parking_info?: string | null
          presentation_room?: string | null
          presentation_time?: string | null
          project_id: string
          updated_at?: string
          venue_address?: string
          venue_map_url?: string | null
          venue_name?: string
        }
        Update: {
          additional_notes?: string | null
          check_in_location?: string | null
          check_in_time?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          emergency_contact?: string | null
          id?: string
          parking_info?: string | null
          presentation_room?: string | null
          presentation_time?: string | null
          project_id?: string
          updated_at?: string
          venue_address?: string
          venue_map_url?: string | null
          venue_name?: string
        }
        Relationships: []
      }
      consent_fields: {
        Row: {
          content: string
          created_at: string | null
          display_order: number | null
          field_key: string
          id: string
          is_required: boolean | null
          project_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          display_order?: number | null
          field_key: string
          id?: string
          is_required?: boolean | null
          project_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          display_order?: number | null
          field_key?: string
          id?: string
          is_required?: boolean | null
          project_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_date: string | null
          copyright_consent: boolean | null
          created_at: string | null
          custom_consents: Json | null
          distribution_consent: boolean | null
          id: string
          portrait_consent: boolean | null
          privacy_consent: boolean | null
          recording_consent: boolean | null
          session_id: string
          signature_image_path: string | null
          updated_at: string | null
        }
        Insert: {
          consent_date?: string | null
          copyright_consent?: boolean | null
          created_at?: string | null
          custom_consents?: Json | null
          distribution_consent?: boolean | null
          id?: string
          portrait_consent?: boolean | null
          privacy_consent?: boolean | null
          recording_consent?: boolean | null
          session_id: string
          signature_image_path?: string | null
          updated_at?: string | null
        }
        Update: {
          consent_date?: string | null
          copyright_consent?: boolean | null
          created_at?: string | null
          custom_consents?: Json | null
          distribution_consent?: boolean | null
          id?: string
          portrait_consent?: boolean | null
          privacy_consent?: boolean | null
          recording_consent?: boolean | null
          session_id?: string
          signature_image_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "speaker_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          field_description: string | null
          field_key: string
          field_label: string
          field_type: string
          id: string
          is_required: boolean | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field_description?: string | null
          field_key: string
          field_label: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field_description?: string | null
          field_key?: string
          field_label?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_files: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_primary: boolean
          session_id: string
          updated_at: string | null
          upload_deadline: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_primary?: boolean
          session_id: string
          updated_at?: string | null
          upload_deadline?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_primary?: boolean
          session_id?: string
          updated_at?: string | null
          upload_deadline?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_files_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "speaker_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_info: {
        Row: {
          created_at: string | null
          custom_fields: Json | null
          id: string
          session_id: string
          special_requests: string | null
          updated_at: string | null
          use_audio: boolean | null
          use_personal_laptop: boolean | null
          use_video: boolean | null
        }
        Insert: {
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          session_id: string
          special_requests?: string | null
          updated_at?: string | null
          use_audio?: boolean | null
          use_personal_laptop?: boolean | null
          use_video?: boolean | null
        }
        Update: {
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          session_id?: string
          special_requests?: string | null
          updated_at?: string | null
          use_audio?: boolean | null
          use_personal_laptop?: boolean | null
          use_video?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "presentation_info_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "speaker_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_settings: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          event_name: string
          id: string
          is_active: boolean | null
          project_name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_name: string
          id?: string
          is_active?: boolean | null
          project_name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_name?: string
          id?: string
          is_active?: boolean | null
          project_name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      speaker_sessions: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          event_name: string | null
          external_supplier_id: string | null
          id: string
          organization: string | null
          position: string | null
          presentation_date: string | null
          project_id: string | null
          speaker_id: string
          speaker_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          event_name?: string | null
          external_supplier_id?: string | null
          id?: string
          organization?: string | null
          position?: string | null
          presentation_date?: string | null
          project_id?: string | null
          speaker_id: string
          speaker_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          event_name?: string | null
          external_supplier_id?: string | null
          id?: string
          organization?: string | null
          position?: string | null
          presentation_date?: string | null
          project_id?: string | null
          speaker_id?: string
          speaker_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speaker_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
