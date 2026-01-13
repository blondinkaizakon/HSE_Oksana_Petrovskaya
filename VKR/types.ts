
export enum AvatarState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  DANGER = 'DANGER',
  SUCCESS = 'SUCCESS'
}

export enum GameLevel {
  PRIMARY_AUDIT = 'PRIMARY_AUDIT',
  HR_JUNGLE = 'HR_JUNGLE',
  TAX_LABYRINTH = 'TAX_LABYRINTH',
  JUDICIAL_FORTRESS = 'JUDICIAL_FORTRESS'
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'HIGH' | 'MEDIUM' | 'LOW';
  matrixReference: string;
  suggestion: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  risks?: Risk[];
  stateChange?: AvatarState;
}

export interface LevelInfo {
  id: GameLevel;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  completed: boolean;
}
