import { tossRequest } from "./mtlsClient.js";

const AUTH_BASE = "/api-partner/v1/apps-in-toss/user/oauth2";

type TokenSuccess = {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  scope: string;
};

type LoginMeSuccess = {
  userKey: number;
};

export async function exchangeAuthorizationCode(input: {
  authorizationCode: string;
  referrer: string;
}) {
  return tossRequest<TokenSuccess>(`${AUTH_BASE}/generate-token`, {
    method: "POST",
    body: {
      authorizationCode: input.authorizationCode,
      referrer: input.referrer,
    },
  });
}

export async function fetchLoginMe(accessToken: string) {
  return tossRequest<LoginMeSuccess>(`${AUTH_BASE}/login-me`, {
    method: "GET",
    accessToken,
  });
}
