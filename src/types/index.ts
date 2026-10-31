export type UiLanguage = 'hi' | 'en';

export interface Voice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  tone: string;
  toneHi: string;
  bestFor: string;
  bestForHi: string;
  description: string;
  descriptionHi: string;
}

export type VoiceStyle = 'natural' | 'professional' | 'friendly' | 'storytelling' | 'energetic';

export interface StyleOption {
  id: VoiceStyle;
  labelHi: string;
  labelEn: string;
  descHi: string;
  descEn: string;
  iconName: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  localName: string;
  flag: string;
}

export interface GeneratedAudio {
  id: string;
  text: string;
  voice: string;
  voiceName: string;
  language: string;
  style: VoiceStyle;
  speed: number;
  blobUrl: string;
  duration: number;
  timestamp: number;
  filename: string;
  modelUsed?: string;
}

export interface SampleText {
  id: string;
  categoryHi: string;
  categoryEn: string;
  titleHi: string;
  titleEn: string;
  text: string;
  lang: string;
  recommendedVoice: string;
  recommendedStyle: VoiceStyle;
}
