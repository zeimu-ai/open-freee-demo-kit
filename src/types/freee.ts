// freee REST API response types (minimum)
export interface FreeeCompany {
  id: number;
  name: string;
  display_name: string;
}

export interface FreeeTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  created_at: number;
}
