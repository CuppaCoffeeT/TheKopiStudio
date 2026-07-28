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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bank_balance_history: {
        Row: {
          balance: number
          client_id: string
          created_at: string
          created_by: string | null
          date: string
          id: string
          is_deleted: boolean
          notes: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          balance: number
          client_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          is_deleted?: boolean
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_balance_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balance_history_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balance_history_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_balance_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          annual_income: number | null
          cpf_ma: number | null
          cpf_oa: number | null
          cpf_sa: number | null
          created_at: string
          created_by: string | null
          created_date: string | null
          date_of_birth: string | null
          email: string | null
          future_income_end_age1: number | null
          future_income_end_age2: number | null
          future_income_end_age3: number | null
          future_income_start_age1: number | null
          future_income_start_age2: number | null
          future_income_start_age3: number | null
          future_income_step1: number | null
          future_income_step2: number | null
          future_income_step3: number | null
          id: string
          include_personal_investment_in_retirement: boolean
          is_deleted: boolean
          last_review_date: string | null
          name: string
          next_review_date: string | null
          notes: string | null
          occupation: string | null
          personal_investment_growth_rate: number | null
          personal_investment_value: number | null
          phone: string | null
          review_frequency: string | null
          risk_profile: string | null
          total_bank_balance: number | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          annual_income?: number | null
          cpf_ma?: number | null
          cpf_oa?: number | null
          cpf_sa?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          date_of_birth?: string | null
          email?: string | null
          future_income_end_age1?: number | null
          future_income_end_age2?: number | null
          future_income_end_age3?: number | null
          future_income_start_age1?: number | null
          future_income_start_age2?: number | null
          future_income_start_age3?: number | null
          future_income_step1?: number | null
          future_income_step2?: number | null
          future_income_step3?: number | null
          id?: string
          include_personal_investment_in_retirement?: boolean
          is_deleted?: boolean
          last_review_date?: string | null
          name: string
          next_review_date?: string | null
          notes?: string | null
          occupation?: string | null
          personal_investment_growth_rate?: number | null
          personal_investment_value?: number | null
          phone?: string | null
          review_frequency?: string | null
          risk_profile?: string | null
          total_bank_balance?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          annual_income?: number | null
          cpf_ma?: number | null
          cpf_oa?: number | null
          cpf_sa?: number | null
          created_at?: string
          created_by?: string | null
          created_date?: string | null
          date_of_birth?: string | null
          email?: string | null
          future_income_end_age1?: number | null
          future_income_end_age2?: number | null
          future_income_end_age3?: number | null
          future_income_start_age1?: number | null
          future_income_start_age2?: number | null
          future_income_start_age3?: number | null
          future_income_step1?: number | null
          future_income_step2?: number | null
          future_income_step3?: number | null
          id?: string
          include_personal_investment_in_retirement?: boolean
          is_deleted?: boolean
          last_review_date?: string | null
          name?: string
          next_review_date?: string | null
          notes?: string | null
          occupation?: string | null
          personal_investment_growth_rate?: number | null
          personal_investment_value?: number | null
          phone?: string | null
          review_frequency?: string | null
          risk_profile?: string | null
          total_bank_balance?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date: string
          follow_up: string | null
          id: string
          is_deleted: boolean
          notes: string | null
          type: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          follow_up?: string | null
          id?: string
          is_deleted?: boolean
          notes?: string | null
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          follow_up?: string | null
          id?: string
          is_deleted?: boolean
          notes?: string | null
          type?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_plans: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          plan: Json
          schema_version: number
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan?: Json
          schema_version?: number
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          plan?: Json
          schema_version?: number
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_plans_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string
          created_at: string
          description: string
          icon_name: string
          id: string
          is_active: boolean
          name: string
          path: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          icon_name: string
          id?: string
          is_active?: boolean
          name: string
          path: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          is_active?: boolean
          name?: string
          path?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          ci_notes: string | null
          client_id: string
          coverage_amount: number | null
          created_at: string
          created_by: string | null
          critical_illness_coverage: number | null
          current_account_value: number | null
          current_cash_value: number | null
          early_critical_illness_coverage: number | null
          eci_notes: string | null
          end_date: string | null
          frequency: string | null
          has_cash_value: boolean | null
          hospital_type: string | null
          id: string
          illustrated_value_age_55: number | null
          illustrated_value_age_65: number | null
          ilp_premium_inclusion_percent: number | null
          integrated_shield_cash: number | null
          integrated_shield_cpf: number | null
          investment_allocation: string | null
          is_deleted: boolean
          is_hospitalization: boolean | null
          is_investment_linked: boolean | null
          policy_number: string | null
          premium: number | null
          provider: string | null
          rider_cash: number | null
          start_date: string | null
          status: string | null
          tpd_coverage: number | null
          tpd_same_as_death: boolean | null
          type: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          ci_notes?: string | null
          client_id: string
          coverage_amount?: number | null
          created_at?: string
          created_by?: string | null
          critical_illness_coverage?: number | null
          current_account_value?: number | null
          current_cash_value?: number | null
          early_critical_illness_coverage?: number | null
          eci_notes?: string | null
          end_date?: string | null
          frequency?: string | null
          has_cash_value?: boolean | null
          hospital_type?: string | null
          id?: string
          illustrated_value_age_55?: number | null
          illustrated_value_age_65?: number | null
          ilp_premium_inclusion_percent?: number | null
          integrated_shield_cash?: number | null
          integrated_shield_cpf?: number | null
          investment_allocation?: string | null
          is_deleted?: boolean
          is_hospitalization?: boolean | null
          is_investment_linked?: boolean | null
          policy_number?: string | null
          premium?: number | null
          provider?: string | null
          rider_cash?: number | null
          start_date?: string | null
          status?: string | null
          tpd_coverage?: number | null
          tpd_same_as_death?: boolean | null
          type: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          ci_notes?: string | null
          client_id?: string
          coverage_amount?: number | null
          created_at?: string
          created_by?: string | null
          critical_illness_coverage?: number | null
          current_account_value?: number | null
          current_cash_value?: number | null
          early_critical_illness_coverage?: number | null
          eci_notes?: string | null
          end_date?: string | null
          frequency?: string | null
          has_cash_value?: boolean | null
          hospital_type?: string | null
          id?: string
          illustrated_value_age_55?: number | null
          illustrated_value_age_65?: number | null
          ilp_premium_inclusion_percent?: number | null
          integrated_shield_cash?: number | null
          integrated_shield_cpf?: number | null
          investment_allocation?: string | null
          is_deleted?: boolean
          is_hospitalization?: boolean | null
          is_investment_linked?: boolean | null
          policy_number?: string | null
          premium?: number | null
          provider?: string | null
          rider_cash?: number | null
          start_date?: string | null
          status?: string | null
          tpd_coverage?: number | null
          tpd_same_as_death?: boolean | null
          type?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      projected_cash_values: {
        Row: {
          age: number
          created_at: string
          created_by: string | null
          id: string
          is_deleted: boolean
          policy_id: string
          updated_at: string
          updated_by: string | null
          user_id: string
          value: number
        }
        Insert: {
          age: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_deleted?: boolean
          policy_id: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
          value: number
        }
        Update: {
          age?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_deleted?: boolean
          policy_id?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "projected_cash_values_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projected_cash_values_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projected_cash_values_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projected_cash_values_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      results: {
        Row: {
          advisor_name: string
          age_range: string | null
          client_id: string | null
          created_at: string
          disc_primary: string
          disc_secondary: string
          id: string
          mbti: string
          meeting: string | null
          notes: string | null
          nv_observations: Json | null
          observations_count: number
          occupation: string | null
          prospect_name: string
          questions_answered: number
          raw_answers: Json | null
          score_c: number
          score_d: number
          score_i: number
          score_s: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          advisor_name: string
          age_range?: string | null
          client_id?: string | null
          created_at?: string
          disc_primary: string
          disc_secondary: string
          id?: string
          mbti: string
          meeting?: string | null
          notes?: string | null
          nv_observations?: Json | null
          observations_count?: number
          occupation?: string | null
          prospect_name: string
          questions_answered?: number
          raw_answers?: Json | null
          score_c?: number
          score_d?: number
          score_i?: number
          score_s?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          advisor_name?: string
          age_range?: string | null
          client_id?: string | null
          created_at?: string
          disc_primary?: string
          disc_secondary?: string
          id?: string
          mbti?: string
          meeting?: string | null
          notes?: string | null
          nv_observations?: Json | null
          observations_count?: number
          occupation?: string | null
          prospect_name?: string
          questions_answered?: number
          raw_answers?: Json | null
          score_c?: number
          score_d?: number
          score_i?: number
          score_s?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "results_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_capabilities: {
        Row: {
          capability: string
          created_at: string | null
          description: string | null
          role: string
        }
        Insert: {
          capability: string
          created_at?: string | null
          description?: string | null
          role: string
        }
        Update: {
          capability?: string
          created_at?: string | null
          description?: string | null
          role?: string
        }
        Relationships: []
      }
      role_modules: {
        Row: {
          created_at: string
          id: string
          is_granted: boolean
          module_id: string
          role: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_granted?: boolean
          module_id: string
          role: string
        }
        Update: {
          created_at?: string
          id?: string
          is_granted?: boolean
          module_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_modules_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          is_system_role: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_system_role?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_modules: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          is_granted: boolean
          module_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_granted: boolean
          module_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_granted?: boolean
          module_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_modules_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_modules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_approved: boolean
          is_deleted: boolean
          name: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_active?: boolean
          is_approved?: boolean
          is_deleted?: boolean
          name: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_approved?: boolean
          is_deleted?: boolean
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_projects: { Args: never; Returns: boolean }
      get_all_users: {
        Args: never
        Returns: {
          email: string
          id: string
          is_active: boolean
          is_approved: boolean
          name: string
          role: string
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_user_modules: {
        Args: { p_user_id: string }
        Returns: {
          category: string
          description: string
          icon_name: string
          module_id: string
          name: string
          path: string
          sort_order: number
        }[]
      }
      get_user_profile: {
        Args: never
        Returns: {
          email: string
          id: string
          is_active: boolean
          is_approved: boolean
          name: string
          role: string
        }[]
      }
      has_capability: { Args: { capability_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_approved_user: { Args: never; Returns: boolean }
      is_field_or_above: { Args: never; Returns: boolean }
      is_finance_role: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
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
