export interface LoginStepResponse {
  mfaRequired: boolean;
  qrCodeUrl: string | null;
}
