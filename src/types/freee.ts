// freee REST API response types (minimum)
export interface FreeeCompany {
  id: number;
  name: string;
  display_name: string;
}

export interface FreeeUser {
  id: number;
  email: string;
  display_name: string;
  companies: FreeeCompany[];
}

export interface FreeeTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: number; // Unix timestamp (ms)
  company_id?: number;
}
