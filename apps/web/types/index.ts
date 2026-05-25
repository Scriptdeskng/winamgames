export interface Player {
    id: string;
    msisdn_hash: string;
    nickname: string;
    coins: number;
    xp: number;
    rank: string;
    streak: number;
    streak_last_date: string | null;
    created_at: string;
  }
  
  export interface Subscription {
    id: string;
    player_id: string;
    plan: "daily" | "weekly";
    status: "active" | "expired" | "grace";
    grace_until: string | null;
    created_at: string;
    expires_at: string;
  }
  
  export interface GameSession {
    id: string;
    player_id: string;
    game_type: "checkmate" | "wisdomdrop";
    puzzles_solved: number;
    hints_used: number;
    coins_earned: number;
    xp_earned: number;
    tickets_earned: number;
    completed_at: string;
  }
  
  export interface Ticket {
    id: string;
    player_id: string;
    draw_week_id: string;
    source: "gameplay" | "streak" | "mission";
    created_at: string;
  }
  
  export interface DrawWeek {
    id: string;
    week_start_wat: string;
    week_end_wat: string;
    status: "open" | "locked" | "drawn" | "settled";
    seed: string | null;
    winners_published: boolean;
  }
  
  export interface Mission {
    id: string;
    title: string;
    description: string;
    condition_type: "puzzles_solved" | "no_hints" | "streak_day";
    condition_target: number;
    reward_amount: number;
    reward_type: "ticket" | "coins";
    is_repeatable: boolean;
  }
  
  export interface PlayerMission {
    id: string;
    player_id: string;
    mission_id: string;
    progress: number;
    completed: boolean;
    completed_at: string | null;
    mission: Mission;
  }
  
  export interface Winner {
    id: string;
    draw_week_id: string;
    player_id: string;
    position: number;
    prize_type: "cash" | "airtime";
    prize_amount: number;
    payment_status: "pending" | "paid";
    player: Pick<Player, "nickname" | "msisdn_hash">;
  }
  
  export interface KYC {
    id: string;
    player_id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    id_type: "NIN" | "BVN";
    id_number: string;
    verified: boolean;
    submitted_at: string;
  }
  
  export interface Banner {
    id: string;
    title: string;
    body: string;
    cta_label: string | null;
    cta_url: string | null;
    is_active: boolean;
    sort_order: number;
  }
  
  export interface PlatformConfig {
    key: string;
    value: string;
    description: string;
    category: string;
  }