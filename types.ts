
export interface Scene {
  id: number;
  narration: string;
  imagePrompt: string;
  animationPrompt: string;
  imageStatus: 'idle' | 'loading' | 'success' | 'error';
  videoStatus: 'idle' | 'loading' | 'success' | 'error';
  audioStatus: 'idle' | 'loading' | 'success' | 'error';
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  imageError?: string;
  videoError?: string;
  audioError?: string;
}

export enum AppStep {
  INPUT = 'INPUT',
  SYNOPSIS = 'SYNOPSIS',
  STORYBOARD = 'STORYBOARD',
  FINISHED = 'FINISHED',
}
