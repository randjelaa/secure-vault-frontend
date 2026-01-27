export interface SecurityPolicy {
  id: number;
  minMasterPasswordLength: number;
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
  updatedAt: string; 
}
