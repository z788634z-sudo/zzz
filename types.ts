export enum Archetype {
  ANCHOR = "The Anchor", // 定海神针
  SPARK = "The Spark", // 气氛组长
  GLUE = "The Glue", // 粘合剂
  GHOST = "The Ghost", // 关键潜水员
  VOID = "The Void", // 话题黑洞
  NPC = "NPC" // 普通成员
}

export interface Node {
  id: string;
  role: Archetype;
  influence_score: number; // 1-10
  sentiment_color: string; // Hex code
  avatar_initial?: string;
}

export interface Link {
  source: string;
  target: string;
  weight: number; // 1-10 strength of connection
  type: 'reply' | 'mention' | 'react' | 'conflict';
  reactions?: {
    emoji: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    count: number;
  }[];
}

export interface EnergyFlow {
  peak_time: string;
  dominant_emotion: string;
  tension_level: 'Low' | 'Medium' | 'High';
  topic_summary: string;
}

export interface SpecialInsight {
  title: string;
  description: string;
  type: 'crush' | 'beef' | 'topic_killer' | 'topic_saver';
  involved_users: string[];
}

export interface TopicBadge {
  user: string;
  title: string; // e.g. "Cold Shoulder King", "Hype Man"
  type: 'killer' | 'reviver';
  description: string;
  icon?: string; // Optional emoji icon suggestion
}

export interface AnalysisResult {
  nodes: Node[];
  links: Link[];
  energy_flow: EnergyFlow;
  insights: SpecialInsight[];
  topic_badges?: TopicBadge[];
  markdown_report: string; // The full qualitative analysis
}

export type AnalysisMode = 'social' | 'work';