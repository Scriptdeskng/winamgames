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
      winam_draw_weeks: {
        Row: {
          draw_executes_at: string
          draw_seed: string | null
          entry_lock_at: string
          id: string
          status: Database["public"]["Enums"]["draw_week_status"]
          total_entries: number
          week_end_wat: string
          week_start_wat: string
        }
        Insert: {
          draw_executes_at: string
          draw_seed?: string | null
          entry_lock_at: string
          id?: string
          status?: Database["public"]["Enums"]["draw_week_status"]
          total_entries?: number
          week_end_wat: string
          week_start_wat: string
        }
        Update: {
          draw_executes_at?: string
          draw_seed?: string | null
          entry_lock_at?: string
          id?: string
          status?: Database["public"]["Enums"]["draw_week_status"]
          total_entries?: number
          week_end_wat?: string
          week_start_wat?: string
        }
        Relationships: []
      }
      winam_entry_ledger: {
        Row: {
          cap_overflow: number
          created_at: string
          draw_week_id: string
          entries_delta: number
          id: string
          player_id: string
          source_id: string | null
          source_type: Database["public"]["Enums"]["entry_source_type"]
          week_total_after: number
        }
        Insert: {
          cap_overflow?: number
          created_at?: string
          draw_week_id: string
          entries_delta?: number
          id?: string
          player_id: string
          source_id?: string | null
          source_type: Database["public"]["Enums"]["entry_source_type"]
          week_total_after?: number
        }
        Update: {
          cap_overflow?: number
          created_at?: string
          draw_week_id?: string
          entries_delta?: number
          id?: string
          player_id?: string
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["entry_source_type"]
          week_total_after?: number
        }
        Relationships: [
          {
            foreignKeyName: "winam_entry_ledger_draw_week_id_fkey"
            columns: ["draw_week_id"]
            isOneToOne: false
            referencedRelation: "winam_draw_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winam_entry_ledger_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "winam_players"
            referencedColumns: ["id"]
          },
        ]
      }
      winam_game_sessions: {
        Row: {
          coins_awarded: number
          completed_at: string
          draw_week_id: string
          duration_seconds: number
          entries_awarded: number
          game_type: Database["public"]["Enums"]["game_type"]
          hints_used: number
          id: string
          is_free_session: boolean
          net_puzzles: number
          player_id: string
          puzzles_solved: number
          session_date_wat: string
        }
        Insert: {
          coins_awarded?: number
          completed_at?: string
          draw_week_id: string
          duration_seconds?: number
          entries_awarded?: number
          game_type: Database["public"]["Enums"]["game_type"]
          hints_used?: number
          id?: string
          is_free_session?: boolean
          net_puzzles?: number
          player_id: string
          puzzles_solved?: number
          session_date_wat: string
        }
        Update: {
          coins_awarded?: number
          completed_at?: string
          draw_week_id?: string
          duration_seconds?: number
          entries_awarded?: number
          game_type?: Database["public"]["Enums"]["game_type"]
          hints_used?: number
          id?: string
          is_free_session?: boolean
          net_puzzles?: number
          player_id?: string
          puzzles_solved?: number
          session_date_wat?: string
        }
        Relationships: [
          {
            foreignKeyName: "winam_game_sessions_draw_week_id_fkey"
            columns: ["draw_week_id"]
            isOneToOne: false
            referencedRelation: "winam_draw_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winam_game_sessions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "winam_players"
            referencedColumns: ["id"]
          },
        ]
      }
      winam_missions: {
        Row: {
          condition_type: Database["public"]["Enums"]["mission_condition_type"]
          condition_value: number
          game_type: Database["public"]["Enums"]["game_type"] | null
          id: string
          is_active: boolean
          reward_amount: number
          reward_type: Database["public"]["Enums"]["reward_type"]
          title: string
        }
        Insert: {
          condition_type: Database["public"]["Enums"]["mission_condition_type"]
          condition_value: number
          game_type?: Database["public"]["Enums"]["game_type"] | null
          id?: string
          is_active?: boolean
          reward_amount: number
          reward_type: Database["public"]["Enums"]["reward_type"]
          title: string
        }
        Update: {
          condition_type?: Database["public"]["Enums"]["mission_condition_type"]
          condition_value?: number
          game_type?: Database["public"]["Enums"]["game_type"] | null
          id?: string
          is_active?: boolean
          reward_amount?: number
          reward_type?: Database["public"]["Enums"]["reward_type"]
          title?: string
        }
        Relationships: []
      }
      winam_otp_sessions: {
        Row: {
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          msisdn_hash: string
          used: boolean
        }
        Insert: {
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          msisdn_hash: string
          used?: boolean
        }
        Update: {
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          msisdn_hash?: string
          used?: boolean
        }
        Relationships: []
      }
      winam_platform_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      winam_player_missions: {
        Row: {
          assigned_date_wat: string
          coins_awarded: number
          completed_at: string | null
          draw_week_id: string
          entries_awarded: number
          id: string
          mission_id: string
          player_id: string
          status: Database["public"]["Enums"]["mission_status"]
        }
        Insert: {
          assigned_date_wat: string
          coins_awarded?: number
          completed_at?: string | null
          draw_week_id: string
          entries_awarded?: number
          id?: string
          mission_id: string
          player_id: string
          status?: Database["public"]["Enums"]["mission_status"]
        }
        Update: {
          assigned_date_wat?: string
          coins_awarded?: number
          completed_at?: string | null
          draw_week_id?: string
          entries_awarded?: number
          id?: string
          mission_id?: string
          player_id?: string
          status?: Database["public"]["Enums"]["mission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "winam_player_missions_draw_week_id_fkey"
            columns: ["draw_week_id"]
            isOneToOne: false
            referencedRelation: "winam_draw_weeks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winam_player_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "winam_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "winam_player_missions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "winam_players"
            referencedColumns: ["id"]
          },
        ]
      }
      winam_players: {
        Row: {
          avatar_id: number | null
          coin_balance: number
          created_at: string
          current_streak: number
          device_fingerprint: string | null
          id: string
          is_flagged: boolean
          last_session_date: string | null
          msisdn_hash: string
          msisdn_last4: string
          nickname: string | null
          rank_tier: Database["public"]["Enums"]["rank_tier"]
          xp_total: number
        }
        Insert: {
          avatar_id?: number | null
          coin_balance?: number
          created_at?: string
          current_streak?: number
          device_fingerprint?: string | null
          id?: string
          is_flagged?: boolean
          last_session_date?: string | null
          msisdn_hash: string
          msisdn_last4: string
          nickname?: string | null
          rank_tier?: Database["public"]["Enums"]["rank_tier"]
          xp_total?: number
        }
        Update: {
          avatar_id?: number | null
          coin_balance?: number
          created_at?: string
          current_streak?: number
          device_fingerprint?: string | null
          id?: string
          is_flagged?: boolean
          last_session_date?: string | null
          msisdn_hash?: string
          msisdn_last4?: string
          nickname?: string | null
          rank_tier?: Database["public"]["Enums"]["rank_tier"]
          xp_total?: number
        }
        Relationships: []
      }
      winam_puzzle_attempts: {
        Row: {
          attempted_at: string
          id: string
          moves_submitted: string[]
          puzzle_id: string
          result: Database["public"]["Enums"]["puzzle_result"]
          session_id: string
          time_to_solve_ms: number
        }
        Insert: {
          attempted_at?: string
          id?: string
          moves_submitted?: string[]
          puzzle_id: string
          result: Database["public"]["Enums"]["puzzle_result"]
          session_id: string
          time_to_solve_ms?: number
        }
        Update: {
          attempted_at?: string
          id?: string
          moves_submitted?: string[]
          puzzle_id?: string
          result?: Database["public"]["Enums"]["puzzle_result"]
          session_id?: string
          time_to_solve_ms?: number
        }
        Relationships: [
          {
            foreignKeyName: "winam_puzzle_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "winam_game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      winam_subscriptions: {
        Row: {
          carrier_ref: string | null
          grace_until: string | null
          id: string
          last_billed_at: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          player_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          carrier_ref?: string | null
          grace_until?: string | null
          id?: string
          last_billed_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          player_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          carrier_ref?: string | null
          grace_until?: string | null
          id?: string
          last_billed_at?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          player_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "winam_subscriptions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "winam_players"
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
      draw_week_status: "open" | "locked" | "drawn" | "settled"
      entry_source_type: "game_session" | "mission" | "streak_bonus"
      game_type: "checkmate" | "wisdomdrop"
      mission_condition_type:
        | "puzzles_solved"
        | "no_hints"
        | "streak_day"
        | "game_type_mix"
      mission_status: "pending" | "completed" | "expired"
      puzzle_result: "correct" | "incorrect" | "hint_used" | "timeout"
      rank_tier:
        | "starter"
        | "recruit"
        | "sergeant"
        | "veteran"
        | "champion"
        | "icon"
        | "legend"
        | "immortal"
      reward_type: "coins" | "entries"
      subscription_plan: "daily" | "weekly"
      subscription_status:
        | "active"
        | "grace"
        | "suspended"
        | "cancelled"
        | "churned"
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
      draw_week_status: ["open", "locked", "drawn", "settled"],
      entry_source_type: ["game_session", "mission", "streak_bonus"],
      game_type: ["checkmate", "wisdomdrop"],
      mission_condition_type: [
        "puzzles_solved",
        "no_hints",
        "streak_day",
        "game_type_mix",
      ],
      mission_status: ["pending", "completed", "expired"],
      puzzle_result: ["correct", "incorrect", "hint_used", "timeout"],
      rank_tier: [
        "starter",
        "recruit",
        "sergeant",
        "veteran",
        "champion",
        "icon",
        "legend",
        "immortal",
      ],
      reward_type: ["coins", "entries"],
      subscription_plan: ["daily", "weekly"],
      subscription_status: [
        "active",
        "grace",
        "suspended",
        "cancelled",
        "churned",
      ],
    },
  },
} as const
