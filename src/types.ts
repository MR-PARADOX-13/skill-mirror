export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  college: string;
  branch: string;
  year: string;
  careerGoal: string;
}

export interface AssessmentScores {
  userId: string;
  pythonScore: number;
  javaScore: number;
  dsaScore: number;
  aptitudeScore: number;
  updatedAt: string;
  attempts?: {
    python?: boolean;
    java?: boolean;
    dsa?: boolean;
    aptitude?: boolean;
  };
}

export interface RoadmapTopic {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  description?: string;
  youtubeUrl?: string;
  youtubeTitle?: string;
  suggestedUrl?: string;
  suggestedReason?: string;
}

export interface RoadmapStatus {
  userId: string;
  careerGoal: string;
  progress: number;
  topics: RoadmapTopic[];
  updatedAt: string;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: string;
}
