
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      "May_Data": {
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
          week_plan_id: string | null
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
          week_plan_id?: string | null
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
          week_plan_id?: string | null
        }
        Relationships: []
      }
      mtd_daily: {
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
      sales_data: {
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
          id: number
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
      sales_data_februrary: {
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
      unified_sales_data: {
        Row: {
          account_name: string | null
          account_ref: string | null
          cost: number | null
          credit: number | null
          data_month: string | null
          department: string | null
          id: string
          import_date: string | null
          margin: number | null
          packs: number | null
          profit: number | null
          record_type: string | null
          rep_name: string
          reporting_day: number | null
          reporting_month: string | null
          reporting_period: string | null
          reporting_year: number | null
          source_id: string | null
          source_table: string | null
          spend: number | null
          sub_rep: string | null
        }
        Insert: {
          account_name?: string | null
          account_ref?: string | null
          cost?: number | null
          credit?: number | null
          data_month?: string | null
          department?: string | null
          id?: string
          import_date?: string | null
          margin?: number | null
          packs?: number | null
          profit?: number | null
          record_type?: string | null
          rep_name: string
          reporting_day?: number | null
          reporting_month?: string | null
          reporting_period?: string | null
          reporting_year?: number | null
          source_id?: string | null
          source_table?: string | null
          spend?: number | null
          sub_rep?: string | null
        }
        Update: {
          account_name?: string | null
          account_ref?: string | null
          cost?: number | null
          credit?: number | null
          data_month?: string | null
          department?: string | null
          id?: string
          import_date?: string | null
          margin?: number | null
          packs?: number | null
          profit?: number | null
          record_type?: string | null
          rep_name?: string
          reporting_day?: number | null
          reporting_month?: string | null
          reporting_period?: string | null
          reporting_year?: number | null
          source_id?: string | null
          source_table?: string | null
          spend?: number | null
          sub_rep?: string | null
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
      unified_sales_stats: {
        Row: {
          record_count: number | null
          reporting_month: string | null
          total_profit: number | null
          total_spend: number | null
          unique_accounts: number | null
          unique_reps: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      execute_sql: {
        Args: {
          sql_query: string
        }
        Returns: unknown
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}
