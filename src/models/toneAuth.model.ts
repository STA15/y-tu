export interface ToneAuthRequest {
  text: string;
  userId?: string;
}

export interface ToneAuthResponse {
  isHuman: boolean;
  confidence: number;
  analysis: {
    naturalness: number;
    coherence: number;
    emotionalMarkers: number;
  };
  timestamp: string;
}
