/**
 * Supabase-generated database types.
 *
 * Regenerate after schema changes with:
 *   supabase gen types typescript --project-id ajjqpryhjjwrttexhevp > src/types/database.types.ts
 * (or via the Supabase MCP `generate_typescript_types` tool).
 *
 * Do not edit by hand.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bakeries: {
        Row: {
          accent_color: string
          card_payments_enabled: boolean
          city: string | null
          cod_enabled: boolean
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          currency: string
          custom_domain: string | null
          description: string | null
          id: string
          locale: string
          logo_url: string | null
          name: string
          owner_id: string
          primary_color: string
          region: string | null
          secondary_color: string
          slug: string
          status: Database["public"]["Enums"]["bakery_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string
          card_payments_enabled?: boolean
          city?: string | null
          cod_enabled?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          locale?: string
          logo_url?: string | null
          name: string
          owner_id: string
          primary_color?: string
          region?: string | null
          secondary_color?: string
          slug: string
          status?: Database["public"]["Enums"]["bakery_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string
          card_payments_enabled?: boolean
          city?: string | null
          cod_enabled?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          locale?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          primary_color?: string
          region?: string | null
          secondary_color?: string
          slug?: string
          status?: Database["public"]["Enums"]["bakery_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bakeries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bakery_occasions: {
        Row: {
          bakery_id: string
          created_at: string
          custom_name: string | null
          id: string
          is_enabled: boolean
          occasion_id: string | null
          sort_order: number
        }
        Insert: {
          bakery_id: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_enabled?: boolean
          occasion_id?: string | null
          sort_order?: number
        }
        Update: {
          bakery_id?: string
          created_at?: string
          custom_name?: string | null
          id?: string
          is_enabled?: boolean
          occasion_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "bakery_occasions_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bakery_occasions_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasion_library"
            referencedColumns: ["id"]
          },
        ]
      }
      bakery_staff: {
        Row: {
          bakery_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Insert: {
          bakery_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id: string
        }
        Update: {
          bakery_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bakery_staff_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bakery_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bakery_subscriptions: {
        Row: {
          bakery_id: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          bakery_id: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          bakery_id?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bakery_subscriptions_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: true
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      cake_designs: {
        Row: {
          ai_image_url: string | null
          ai_prompt: string | null
          bakery_id: string
          computed_price_minor: number
          config: Json
          created_at: string
          end_customer_id: string | null
          id: string
          is_saved: boolean
          name: string
          preview_image_url: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          ai_image_url?: string | null
          ai_prompt?: string | null
          bakery_id: string
          computed_price_minor?: number
          config?: Json
          created_at?: string
          end_customer_id?: string | null
          id?: string
          is_saved?: boolean
          name?: string
          preview_image_url?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_image_url?: string | null
          ai_prompt?: string | null
          bakery_id?: string
          computed_price_minor?: number
          config?: Json
          created_at?: string
          end_customer_id?: string | null
          id?: string
          is_saved?: boolean
          name?: string
          preview_image_url?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cake_designs_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cake_designs_end_customer_id_fkey"
            columns: ["end_customer_id"]
            isOneToOne: false
            referencedRelation: "end_customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cake_designs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "cake_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      cake_templates: {
        Row: {
          bakery_id: string
          base_price_minor: number
          config: Json
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          occasion_id: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          bakery_id: string
          base_price_minor?: number
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          occasion_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bakery_id?: string
          base_price_minor?: number
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          occasion_id?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cake_templates_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cake_templates_occasion_id_fkey"
            columns: ["occasion_id"]
            isOneToOne: false
            referencedRelation: "occasion_library"
            referencedColumns: ["id"]
          },
        ]
      }
      end_customer_profiles: {
        Row: {
          bakery_id: string
          created_at: string
          default_address: Json | null
          display_name: string
          id: string
          loyalty_points: number
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bakery_id: string
          created_at?: string
          default_address?: Json | null
          display_name?: string
          id?: string
          loyalty_points?: number
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bakery_id?: string
          created_at?: string
          default_address?: Json | null
          display_name?: string
          id?: string
          loyalty_points?: number
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "end_customer_profiles_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "end_customer_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          bakery_id: string
          cake_design_id: string | null
          cake_template_id: string | null
          created_at: string
          end_customer_id: string
          id: string
        }
        Insert: {
          bakery_id: string
          cake_design_id?: string | null
          cake_template_id?: string | null
          created_at?: string
          end_customer_id: string
          id?: string
        }
        Update: {
          bakery_id?: string
          cake_design_id?: string | null
          cake_template_id?: string | null
          created_at?: string
          end_customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_cake_design_id_fkey"
            columns: ["cake_design_id"]
            isOneToOne: false
            referencedRelation: "cake_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_cake_template_id_fkey"
            columns: ["cake_template_id"]
            isOneToOne: false
            referencedRelation: "cake_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_end_customer_id_fkey"
            columns: ["end_customer_id"]
            isOneToOne: false
            referencedRelation: "end_customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_minor: number
          bakery_id: string
          created_at: string
          currency: string
          due_at: string | null
          end_customer_id: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          order_id: string
          paid_at: string | null
          pdf_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
        }
        Insert: {
          amount_minor?: number
          bakery_id: string
          created_at?: string
          currency?: string
          due_at?: string | null
          end_customer_id?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          order_id: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          bakery_id?: string
          created_at?: string
          currency?: string
          due_at?: string | null
          end_customer_id?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          order_id?: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_end_customer_id_fkey"
            columns: ["end_customer_id"]
            isOneToOne: false
            referencedRelation: "end_customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          bakery_id: string
          created_at: string
          end_customer_id: string
          id: string
          order_id: string | null
          points: number
          reason: string | null
        }
        Insert: {
          bakery_id: string
          created_at?: string
          end_customer_id: string
          id?: string
          order_id?: string | null
          points: number
          reason?: string | null
        }
        Update: {
          bakery_id?: string
          created_at?: string
          end_customer_id?: string
          id?: string
          order_id?: string | null
          points?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_end_customer_id_fkey"
            columns: ["end_customer_id"]
            isOneToOne: false
            referencedRelation: "end_customer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          bakery_id: string
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_base_price: boolean
          metadata: Json
          name: string
          price_minor: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          bakery_id: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_base_price?: boolean
          metadata?: Json
          name: string
          price_minor?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bakery_id?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_base_price?: boolean
          metadata?: Json
          name?: string
          price_minor?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          bakery_id: string
          body: string
          created_at: string
          id: string
          order_id: string | null
          read_at: string | null
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          attachments?: Json
          bakery_id: string
          body: string
          created_at?: string
          id?: string
          order_id?: string | null
          read_at?: string | null
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          attachments?: Json
          bakery_id?: string
          body?: string
          created_at?: string
          id?: string
          order_id?: string | null
          read_at?: string | null
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      occasion_library: {
        Row: {
          category: string
          created_at: string
          default_enabled: boolean
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          default_enabled?: boolean
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          default_enabled?: boolean
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          bakery_id: string
          changed_by: string | null
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          bakery_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          bakery_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          bakery_id: string
          cake_design_id: string | null
          created_at: string
          currency: string
          delivery_address: Json | null
          delivery_date: string | null
          delivery_fee_minor: number
          delivery_slot: string | null
          discount_minor: number
          end_customer_id: string | null
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          subtotal_minor: number
          total_minor: number
          updated_at: string
        }
        Insert: {
          bakery_id: string
          cake_design_id?: string | null
          created_at?: string
          currency?: string
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_fee_minor?: number
          delivery_slot?: string | null
          discount_minor?: number
          end_customer_id?: string | null
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          subtotal_minor?: number
          total_minor?: number
          updated_at?: string
        }
        Update: {
          bakery_id?: string
          cake_design_id?: string | null
          created_at?: string
          currency?: string
          delivery_address?: Json | null
          delivery_date?: string | null
          delivery_fee_minor?: number
          delivery_slot?: string | null
          discount_minor?: number
          end_customer_id?: string | null
          fulfillment_type?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          subtotal_minor?: number
          total_minor?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_bakery_id_fkey"
            columns: ["bakery_id"]
            isOneToOne: false
            referencedRelation: "bakeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cake_design_id_fkey"
            columns: ["cake_design_id"]
            isOneToOne: false
            referencedRelation: "cake_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_end_customer_id_fkey"
            columns: ["end_customer_id"]
            isOneToOne: false
            referencedRelation: "end_customer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_order_status: {
        Args: {
          p_bakery: string
          p_order_number: string
        }
        Returns: {
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          fulfillment_type: Database["public"]["Enums"]["fulfillment_type"]
          delivery_date: string | null
          total_minor: number
          currency: string
          created_at: string
          design_name: string
        }[]
      }
      place_order: {
        Args: {
          p_bakery: string
          p_menu_ids: string[]
          p_design_name: string
          p_config: Json
          p_fulfillment: string
          p_customer_name: string
          p_customer_phone: string
          p_address: Json
          p_delivery_date: string | null
          p_delivery_slot: string
          p_payment_method: string
        }
        Returns: {
          order_number: string
          total_minor: number
          currency: string
          locale: string
        }[]
      }
      provision_bakery: {
        Args: {
          p_name: string
          p_slug: string
          p_plan: Database["public"]["Enums"]["subscription_tier"]
          p_primary: string
          p_secondary: string
          p_accent: string
          p_city: string
          p_description: string
          p_menu: Json
        }
        Returns: {
          bakery_id: string
          bakery_slug: string
        }[]
      }
    }
    Enums: {
      bakery_status: "pending" | "active" | "suspended" | "cancelled"
      fulfillment_type: "delivery" | "pickup"
      invoice_status: "draft" | "issued" | "paid" | "void"
      order_status:
        | "pending"
        | "confirmed"
        | "in_production"
        | "ready"
        | "out_for_delivery"
        | "delivered"
        | "completed"
        | "cancelled"
      payment_method: "stripe_card" | "cash_on_delivery"
      payment_status:
        | "unpaid"
        | "pending"
        | "paid"
        | "refunded"
        | "partially_refunded"
        | "failed"
      staff_role: "bakery_owner" | "bakery_staff"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
      subscription_tier: "basic" | "premium" | "enterprise"
      user_role:
        | "platform_admin"
        | "bakery_owner"
        | "bakery_staff"
        | "end_customer"
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
    Enums: {
      bakery_status: ["pending", "active", "suspended", "cancelled"],
      fulfillment_type: ["delivery", "pickup"],
      invoice_status: ["draft", "issued", "paid", "void"],
      order_status: [
        "pending",
        "confirmed",
        "in_production",
        "ready",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
      ],
      payment_method: ["stripe_card", "cash_on_delivery"],
      payment_status: [
        "unpaid",
        "pending",
        "paid",
        "refunded",
        "partially_refunded",
        "failed",
      ],
      staff_role: ["bakery_owner", "bakery_staff"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "unpaid",
      ],
      subscription_tier: ["basic", "premium", "enterprise"],
      user_role: [
        "platform_admin",
        "bakery_owner",
        "bakery_staff",
        "end_customer",
      ],
    },
  },
} as const
