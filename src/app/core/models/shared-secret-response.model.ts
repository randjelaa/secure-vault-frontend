export interface SharedSecretResponse {
  id: number;
  name: string;
  encryptedBlob: string;
  iv: string;                      
  encryptedSymmetricKey: string;   
  ownerUsername: string;
}
