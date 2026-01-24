export interface VaultSecret {
  id: number;
  name: string;
  encryptedBlob: string;
  iv: string;
}

export interface VaultSecretPayload {
  name: string;
  encryptedBlob: string;
  iv: string;
}
