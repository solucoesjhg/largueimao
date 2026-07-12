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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      leituras: {
        Row: {
          conver_le: string
          id_le: string
          ultima_le: string
          usuari_le: string
        }
        Insert: {
          conver_le: string
          id_le?: string
          ultima_le?: string
          usuari_le: string
        }
        Update: {
          conver_le?: string
          id_le?: string
          ultima_le?: string
          usuari_le?: string
        }
        Relationships: [
          {
            foreignKeyName: "leituras_conver_le_fkey"
            columns: ["conver_le"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id_co"]
          },
        ]
      }
      conversas: {
        Row: {
          compra_co: string
          criado_co: string
          id_co: string
          item_co: string
          vended_co: string
          atuali_co: string
        }
        Insert: {
          compra_co: string
          criado_co?: string
          id_co?: string
          item_co: string
          vended_co: string
          atuali_co?: string
        }
        Update: {
          compra_co?: string
          criado_co?: string
          id_co?: string
          item_co?: string
          vended_co?: string
          atuali_co?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_item_co_fkey"
            columns: ["item_co"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id_it"]
          },
        ]
      }
      favoritos: {
        Row: {
          criado_fa: string
          id_fa: string
          item_fa: string
          usuari_fa: string
        }
        Insert: {
          criado_fa?: string
          id_fa?: string
          item_fa: string
          usuari_fa: string
        }
        Update: {
          criado_fa?: string
          id_fa?: string
          item_fa?: string
          usuari_fa?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_item_fa_fkey"
            columns: ["item_fa"]
            isOneToOne: false
            referencedRelation: "itens"
            referencedColumns: ["id_it"]
          },
        ]
      }
      itens: {
        Row: {
          catego_it: string
          criado_it: string
          descri_it: string | null
          id_it: string
          imagem_it: string | null
          fotos_it: string[]
          latitu_it: number | null
          local_it: string | null
          longit_it: number | null
          preco_it: number
          status_it: string
          titulo_it: string
          atuali_it: string
          usuari_it: string
        }
        Insert: {
          catego_it?: string
          criado_it?: string
          descri_it?: string | null
          id_it?: string
          imagem_it?: string | null
          fotos_it?: string[]
          latitu_it?: number | null
          local_it?: string | null
          longit_it?: number | null
          preco_it?: number
          status_it?: string
          titulo_it: string
          atuali_it?: string
          usuari_it: string
        }
        Update: {
          catego_it?: string
          criado_it?: string
          descri_it?: string | null
          id_it?: string
          imagem_it?: string | null
          fotos_it?: string[]
          latitu_it?: number | null
          local_it?: string | null
          longit_it?: number | null
          preco_it?: number
          status_it?: string
          titulo_it?: string
          atuali_it?: string
          usuari_it?: string
        }
        Relationships: []
      }
      mensagens: {
        Row: {
          text_me: string
          conver_me: string
          criado_me: string
          id_me: string
          remete_me: string
          reacao_me: string | null
          resp_me: string | null
        }
        Insert: {
          text_me: string
          conver_me: string
          criado_me?: string
          id_me?: string
          remete_me: string
          reacao_me?: string | null
          resp_me?: string | null
        }
        Update: {
          text_me?: string
          conver_me?: string
          criado_me?: string
          id_me?: string
          remete_me?: string
          reacao_me?: string | null
          resp_me?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conver_me_fkey"
            columns: ["conver_me"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id_co"]
          },
        ]
      }
      perfis: {
        Row: {
          avatar_pe: string | null
          bio_pe: string | null
          criado_pe: string
          nome_pe: string | null
          id_pe: string
          atuali_pe: string
          usuari_pe: string
        }
        Insert: {
          avatar_pe?: string | null
          bio_pe?: string | null
          criado_pe?: string
          nome_pe?: string | null
          id_pe?: string
          atuali_pe?: string
          usuari_pe: string
        }
        Update: {
          avatar_pe?: string | null
          bio_pe?: string | null
          criado_pe?: string
          nome_pe?: string | null
          id_pe?: string
          atuali_pe?: string
          usuari_pe?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conversa_participant: {
        Args: { _conversa_id: string; _user_id: string }
        Returns: boolean
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
