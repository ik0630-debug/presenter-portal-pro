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
      consent_records: {
        Row: {
          consent_date: string | null
          copyright_consent: boolean | null
          created_at: string | null
          distribution_consent: boolean | null
          id: string
          portrait_consent: boolean | null
          recording_consent: boolean | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          consent_date?: string | null
          copyright_consent?: boolean | null
          created_at?: string | null
          distribution_consent?: boolean | null
          id?: string
          portrait_consent?: boolean | null
          recording_consent?: boolean | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          consent_date?: string | null
          copyright_consent?: boolean | null
          created_at?: string | null
          distribution_consent?: boolean | null
          id?: string
          portrait_consent?: boolean | null
          recording_consent?: boolean | null
          session_id?: string
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
      presentation_files: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
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
          speaker_id?: string
          speaker_name?: string
          updated_at?: string | null
        }
        Relationships: []
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
