export interface SharedSecretResponse {
  id: number;
  name: string;
  encryptedBlob: string;
  iv: string;                      // ako ga backend šalje
  encryptedSymmetricKey: string;   // ako ga backend šalje
  ownerUsername: string;
}
