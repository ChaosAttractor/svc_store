export interface LoginDataResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  'not-before-policy': number;
  session_state: string;
  scope: string;
  expired?: number;
}

export interface StatusTokenResponse {
  exp?: number;
  iat?: number;
  jti?: string;
  iss?: string;
  aud?: string;
  sub?: string;
  typ?: string;
  azp?: string;
  session_state?: string;
  scope?: string;
  sid?: string;
  client_id?: string;
  username?: string;
  active: boolean;
  resource_access?: any;
  realm_access?: { roles: string[] };
  clientId?: string;
}

export interface TokenInterface {
  azp: string;
  realm_access: { roles: string[] };
  email: string;
  sub: string;
  sid: string,
  session_state: string;
  clientId?: string;
}
