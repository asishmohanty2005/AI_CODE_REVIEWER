export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_active: boolean;
  preferred_ai_provider: "gemini" | "openai" | string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_reviews: number;
  favorite_reviews: number;
  average_score: number;
  languages_used: Record<string, number>;
  reviews_this_week: number;
  reviews_this_month: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface IssueItem {
  severity: string;
  title: string;
  description: string;
  line?: number | null;
  suggestion?: string | null;
}

export interface LineExplanation {
  line: number;
  code: string;
  explanation: string;
}

export interface ComplexityAnalysis {
  time_complexity?: string;
  space_complexity?: string;
  explanation?: string;
}

export interface ReviewResult {
  quality_score: number;
  summary: string;
  language_detected?: string;
  bugs: IssueItem[];
  security_issues: IssueItem[];
  performance_issues: IssueItem[];
  readability: { score?: number; notes?: string[] };
  maintainability: { score?: number; notes?: string[] };
  best_practices: IssueItem[];
  complexity?: ComplexityAnalysis;
  optimizations: string[];
  refactored_code?: string;
  line_explanations: LineExplanation[];
  strengths: string[];
}

export interface Review {
  id: number;
  owner_id: number;
  title: string;
  language: string;
  source_code: string;
  filename?: string | null;
  ai_provider: string;
  ai_model?: string | null;
  quality_score?: number | null;
  summary?: string | null;
  result?: ReviewResult | null;
  is_favorite: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewListItem {
  id: number;
  title: string;
  language: string;
  filename?: string | null;
  quality_score?: number | null;
  summary?: string | null;
  is_favorite: boolean;
  status: string;
  created_at: string;
}

export interface ReviewListResponse {
  items: ReviewListItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ChatMessage {
  id: number;
  review_id: number;
  role: "user" | "assistant" | "system" | string;
  content: string;
  action?: string | null;
  created_at: string;
}

export const SUPPORTED_LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "sql", label: "SQL" },
] as const;

export const MONACO_LANG_MAP: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  java: "java",
  c: "c",
  cpp: "cpp",
  go: "go",
  rust: "rust",
  html: "html",
  css: "css",
  sql: "sql",
  auto: "plaintext",
};
