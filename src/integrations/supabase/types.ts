export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      "April Data": {
        Row: {
          "Account Name": string | null
          "Account Ref": string | null
          Cost: number | null
          Credit: number | null
          Department: string | null
          id: string
          Margin: number | null
          Packs: number | null
          Profit: number | null
          Rep: string
          Spend: number | null
          "Sub-Rep": string | null
        }
        Insert: {
          "Account Name"?: string | null
          "Account Ref"?: string | null
          Cost?: number | null
          Credit?: number | null
          Department?: string | null
          id?: string
          Margin?: number | null
          Packs?: number | null
          Profit?: number | null
          Rep: string
          Spend?: number | null
          "Sub-Rep"?: string | null
        }
        Update: {
          "Account Name"?: string | null
          "Account Ref"?: string | null
          Cost?: number | null
          Credit?: number | null
          Department?: string | null
          id?: string
          Margin?: number | null
          Packs?: number | null
          Profit?: number | null
          Rep?: string
          Spend?: number | null
          "Sub-Rep"?: string | null
        }
        Relationships: []
      }
      customer_visits: {
        Row: {
          comments: string | null
          contact_name: string | null
          created_at: string | null
          customer_name: string
          customer_ref: string
          date: string
          has_order: boolean | null
          id: string
          profit: number | null
          updated_at: string | null
          user_id: string
          visit_type: string
        }
        Insert: {
          comments?: string | null
          contact_name?: string | null
          created_at?: string | null
          customer_name: string
          customer_ref: string
          date: string
          has_order?: boolean | null
          id?: string
          profit?: number | null
          updated_at?: string | null
          user_id: string
          visit_type: string
        }
        Update: {
          comments?: string | null
          contact_name?: string | null
          created_at?: string | null
          customer_name?: string
          customer_ref?: string
          date?: string
          has_order?: boolean | null
          id?: string
          profit?: number | null
          updated_at?: string | null
          user_id?: string
          visit_type?: string
        }
        Relationships: []
      }
      "February Data": {
        Row: {
          "Account Name": string | null
          "Account Ref": string | null
          Cost: number | null
          Credit: number | null
          Department: string | null
          id: string
          Margin: number | null
          Packs: number | null
          Profit: number | null
          Rep: string
          Spend: number | null
          "Sub-Rep": string | null
        }
        Insert: {
          "Account Name"?: string | null
          "Account Ref"?: string | null
          Cost?: number | null
          Credit?: number | null
          Department?: string | null
          id?: string
          Margin?: number | null
          Packs?: number | null
          Profit?: number | null
          Rep: string
          Spend?: number | null
          "Sub-Rep"?: string | null
        }
        Update: {
          "Account Name"?: string | null
          "Account Ref"?: string | null
          Cost?: number | null
          Credit?: number | null
          Department?: string | null
          id?: string
          Margin?: number | null
          Packs?: number | null
          Profit?: number | null
          Rep?: string
          Spend?: number | null
          "Sub-Rep"?: string | null
        }
        Relationships: []
      }
      "March Data": {
        Row: {
          account_name: string
          account_ref: string
          cost: number
          credit: number
          id: number
          import_date: string | null
          margin: number
          packs: number
          profit: number
          rep_name: string
          rep_type: string
          reporting_period: string
          spend: number
          sub_rep: string | null
        }
        Insert: {
          account_name: string
          account_ref: string
          cost?: number
          credit?: number
          id?: number
          import_date?: string | null
          margin?: number
          packs?: number
          profit?: number
          rep_name: string
          rep_type?: string
          reporting_period: string
          spend?: number
          sub_rep?: string | null
        }
        Update: {
          account_name?: string
          account_ref?: string
          cost?: number
          credit?: number
          id?: number
          import_date?: string | null
          margin?: number
          packs?: number
          profit?: number
          rep_name?: string
          rep_type?: string
          reporting_period?: string
          spend?: number
          sub_rep?: string | null
        }
        Relationships: []
      }
      "March Data MTD": {
        Row: {
          "Account Name": string | null
          "Account Ref": string | null
          Cost: number | null
          Credit: number | null
          Department: string | null
          id: string
          Margin: number | null
          Packs: number | null
          Profit: number | null
          Rep: string
          Spend: number | null
          "Sub-Rep": string | null
        }
        Insert: {
          "Account Name"?: string | null
          "Account Ref"?: string | null
          Cost?: number | null
          Credit?: number | null
          Department?: string | null
          id?: string
          Margin?: number | null
          Packs?: number | null
          Profit?: number | null
          Rep: string
          Spend?: number | null
          "Sub-Rep"?: string | null
        }
        Update: {
          "Account Name"?: string | null
          "Account Ref"?: string | null
          Cost?: number | null
          Credit?: number | null
          Department?: string | null
          id?: string
          Margin?: number | null
          Packs?: number | null
          Profit?: number | null
          Rep?: string
          Spend?: number | null
          "Sub-Rep"?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      week_plans: {
        Row: {
          created_at: string | null
          customer_name: string
          customer_ref: string
          id: string
          notes: string | null
          planned_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          customer_ref: string
          id?: string
          notes?: string | null
          planned_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          customer_ref?: string
          id?: string
          notes?: string | null
          planned_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      combined_rep_performance: {
        Row: {
          margin: number | null
          rep_name: string | null
          reporting_period: string | null
          retail_accounts: number | null
          retail_packs: number | null
          retail_profit: number | null
          retail_spend: number | null
          reva_accounts: number | null
          reva_packs: number | null
          reva_profit: number | null
          reva_spend: number | null
          total_accounts: number | null
          total_packs: number | null
          total_profit: number | null
          total_spend: number | null
          wholesale_accounts: number | null
          wholesale_packs: number | null
          wholesale_profit: number | null
          wholesale_spend: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      clear_last_mtd_daily: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_march_rolling: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_mtd_daily: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fetch_all_march_rolling_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          "Account Name": string | null
          "Account Ref": string | null
          Cost: number | null
          Credit: number | null
          Department: string | null
          id: string
          Margin: number | null
          Packs: number | null
          Profit: number | null
          Rep: string
          Spend: number | null
          "Sub-Rep": string | null
        }[]
      }
      fetch_all_mtd_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          "Account Name": string | null
          "Account Ref": string | null
          Cost: number | null
          Credit: number | null
          Department: string | null
          id: string
          Margin: number | null
          Packs: number | null
          Profit: number | null
          Rep: string
          Spend: number | null
          "Sub-Rep": string | null
        }[]
      }
      get_april_mtd_data_by_department: {
        Args: { dept: string }
        Returns: Json
      }
      get_april_top_reps_by_margin: {
        Args: { limit_count?: number }
        Returns: Json
      }
      get_april_top_reps_by_profit: {
        Args: { limit_count?: number }
        Returns: Json
      }
      get_department_counts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_department_profit: {
        Args: { dept: string }
        Returns: number
      }
      get_march_top_reps_by_margin: {
        Args: { limit_count?: number }
        Returns: Json
      }
      get_march_top_reps_by_profit: {
        Args: { limit_count?: number }
        Returns: Json
      }
      get_retail_profit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_reva_profit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_total_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_total_profit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_unique_departments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_wholesale_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_wholesale_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_wholesale_profit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      replace_mtd_daily: {
        Args: { data: Json }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
