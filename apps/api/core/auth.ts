import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { RuntimeEnv, UserIdentity } from './types';

// A public verification-key cache contains no per-request identity or credentials.
const firebaseKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));

export async function verifyFirebaseToken(token: string, projectId: string, keys: JWTVerifyGetKey = firebaseKeys): Promise<UserIdentity> {
  if (!projectId || token.length > 10000) throw new Error('Invalid authentication configuration or token');
  const {payload} = await jwtVerify(token, keys, {
    algorithms: ['RS256'], issuer: `https://securetoken.google.com/${projectId}`, audience: projectId,
    requiredClaims: ['exp','iat','sub','auth_time'], clockTolerance: 5,
  });
  const now = Math.floor(Date.now()/1000);
  if (!payload.sub || payload.sub.length > 128 || typeof payload.auth_time !== 'number' || payload.auth_time > now + 5 || typeof payload.iat !== 'number' || payload.iat > now + 5) throw new Error('Invalid identity claims');
  return {id:payload.sub,displayName: typeof payload.name === 'string' ? payload.name.slice(0,100) : 'Sentinel member', demo:false};
}

export async function resolveIdentity(request: Request, env: RuntimeEnv): Promise<UserIdentity | null> {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return null;
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(authorization);
  if (!match || !env.FIREBASE_PROJECT_ID) throw new Error('Invalid authentication');
  return verifyFirebaseToken(match[1], env.FIREBASE_PROJECT_ID);
}
