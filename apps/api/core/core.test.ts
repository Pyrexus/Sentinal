import {describe,it,expect} from 'vitest';
import {createLocalJWKSet,exportJWK,generateKeyPair,SignJWT} from 'jose';
import {encryptText,decryptText,hashIp,constantTimeEqual} from './crypto';
import {verifyFirebaseToken} from './auth';
import {MemoryRepository} from './repository';

describe('privacy encryption',()=>{
  const secret=btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
  it('uses a new IV for each record and supports key versions',async()=>{
    const first=await encryptText('private message',secret,'v2'),second=await encryptText('private message',secret,'v2');
    expect(first).not.toEqual(second);expect(first).not.toContain('private message');
    expect(await decryptText(first,{v2:secret})).toBe('private message');
    await expect(decryptText(first,{v1:secret})).rejects.toThrow('Unknown encryption key version');
  });
  it('rejects tampered ciphertext and non-256-bit keys',async()=>{
    const encrypted=await encryptText('private',secret);
    const parts=encrypted.split(':');parts[2]=(parts[2][0]==='A'?'B':'A')+parts[2].slice(1);
    await expect(decryptText(parts.join(':'),secret)).rejects.toThrow();
    await expect(encryptText('private',btoa('short'))).rejects.toThrow();
  });
  it('salts IP identifiers and compares secret digests',async()=>{
    expect(await hashIp('192.0.2.4','test-salt-123456789')).not.toBe(await hashIp('192.0.2.4','different-salt-1234'));
    expect(await constantTimeEqual('admin-test','admin-test')).toBe(true);expect(await constantTimeEqual('admin-test','other')).toBe(false);
  });
});

describe('Firebase verification with local JWKS',()=>{
  async function fixture(overrides:{issuer?:string;audience?:string;expiration?:number}={}){
    const {privateKey,publicKey}=await generateKeyPair('RS256');const publicJwk=await exportJWK(publicKey);publicJwk.kid='test-key';
    const token=await new SignJWT({auth_time:Math.floor(Date.now()/1000),name:'Test learner'}).setProtectedHeader({alg:'RS256',kid:'test-key'}).setSubject('learner-123').setIssuedAt().setIssuer(overrides.issuer||'https://securetoken.google.com/sentinel-test').setAudience(overrides.audience||'sentinel-test').setExpirationTime(overrides.expiration||Math.floor(Date.now()/1000)+60).sign(privateKey);
    return {token,keys:createLocalJWKSet({keys:[publicJwk]})};
  }
  it('accepts a valid signed token',async()=>{const {token,keys}=await fixture();expect((await verifyFirebaseToken(token,'sentinel-test',keys)).id).toBe('learner-123');});
  it.each([{audience:'another-project'},{issuer:'https://attacker.example'},{expiration:Math.floor(Date.now()/1000)-60}])('rejects invalid claims %o',async overrides=>{const {token,keys}=await fixture(overrides);await expect(verifyFirebaseToken(token,'sentinel-test',keys)).rejects.toThrow();});
});

describe('repository ownership and rate limits',()=>{
  it('enforces fixed windows and separate caller keys',async()=>{
    const repo=new MemoryRepository();expect((await repo.consumeRateLimit('ip:a',2,10000,1000)).allowed).toBe(true);
    expect((await repo.consumeRateLimit('ip:a',2,10000,1001)).allowed).toBe(true);
    const blocked=await repo.consumeRateLimit('ip:a',2,10000,1002);expect(blocked.allowed).toBe(false);expect(blocked.retryAfter).toBe(10);
    expect((await repo.consumeRateLimit('ip:b',2,10000,1003)).allowed).toBe(true);expect((await repo.consumeRateLimit('ip:a',2,10000,11000)).allowed).toBe(true);
  });
  it('prevents repeated XP and removes only the selected user’s data',async()=>{
    const repo=new MemoryRepository();await repo.ensureUser({id:'a',displayName:'A',demo:true});await repo.ensureUser({id:'b',displayName:'B',demo:true});
    const event={key:'lesson:otp',kind:'quiz',title:'OTP quiz',description:'Completed',xp:25};
    const outcomes=await Promise.all([repo.appendActivity('a',event),repo.appendActivity('a',event)]);expect(outcomes.filter(Boolean)).toHaveLength(1);
    await repo.appendActivity('b',event);await repo.updateChecklist('b',{mfa:true});
    expect(await repo.timeline('a')).toHaveLength(1);await repo.deleteUser('a');expect(await repo.timeline('a')).toHaveLength(0);expect(await repo.timeline('b')).toHaveLength(1);expect((await repo.getState('b')).checklist.mfa).toBe(true);
  });
});
