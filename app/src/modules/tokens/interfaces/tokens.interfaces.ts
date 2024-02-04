export interface GetAuthTokensInterface {
  accessToken: string,
  refreshToken: string,
  sessionKey: string,
}

export interface GetTokensInterface {
  sessionToken?: string,
  sessionKey: string,
  accessToken: string,
  refreshToken: string,
  uid: string,
  sessionId: string,
  oldSessionToken?: string,
  eolOldSessionToken?: string,
  expires?: number,
}

interface SessionInterface {
  id: number,
  labels: string[],
  properties: GetTokensInterface
}

export interface SessionRowInterface {
  data: {
    session: SessionInterface
  }[]
}
