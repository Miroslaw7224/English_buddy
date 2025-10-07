export interface User {
  id: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | null;
  placement_score?: number | null;
  placement_taken_at?: string | null;
  placement_mode?: 'adaptive' | 'linear' | null;
  placement_source?: 'ai' | 'static' | null;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  getUsername: () => string | null;
  setUser: (user: User | null) => void;
  updateCefrLevel: (level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') => Promise<void>;
  updatePlacementResults: (score: number, answers: any[], mode: 'adaptive' | 'linear', source: 'ai' | 'static') => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;
