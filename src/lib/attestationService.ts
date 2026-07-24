export class AttestationService {
  private deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }

  async validatePrerequisites(): Promise<{ success: true } | { success: false; error: string }> {
    return { success: true };
  }

  async createAttestationRecordOnline(): Promise<any> {
    return null;
  }

  async signAndGenerateQr(): Promise<{ signatureNonce: string; signatureIssuedAt: string; payloadSignedJson: string; hashSha256: string }> {
    return {
      signatureNonce: 'stub',
      signatureIssuedAt: new Date().toISOString(),
      payloadSignedJson: '{}',
      hashSha256: 'stub',
    };
  }
}

export const useAttestationService = () => new AttestationService('stub-device');
