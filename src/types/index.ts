// Kurum tipleri
export type Institution = 
  | 'yargitay'
  | 'danistay'
  | 'emsal'
  | 'bedesten'
  | 'uyusmazlik'
  | 'anayasa'
  | 'kik'
  | 'rekabet'
  | 'sayistay'
  | 'kvkk'
  | 'bddk';

export interface InstitutionInfo {
  id: Institution;
  name: string;
  description: string;
  color: string;
  icon: string;
  apiEndpoint: string;
}

// Arama parametreleri
export interface SearchParams {
  query: string;
  institutions: Institution[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  department?: string;
  courtType?: string;
  decisionType?: string;
  page?: number;
  limit?: number;
}

// Arama sonuçları
export interface SearchResult {
  id: string;
  institutionId: Institution;
  title: string;
  summary: string;
  content: string;
  date: Date;
  url: string;
  department?: string;
  decisionNumber?: string;
  keywords: string[];
  relevanceScore: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  page: number;
  totalPages: number;
  searchTime: number;
}

// Kullanıcı tipleri
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  subscription: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  lastLoginAt: Date;
}

// LLM tipleri
export type LLMProvider = 'openai' | 'anthropic' | 'google';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface LLMConversation {
  id: string;
  userId: string;
  documentId: string;
  messages: LLMMessage[];
  provider: LLMProvider;
  createdAt: Date;
  updatedAt: Date;
}

// API yanıt tipleri
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filtreleme seçenekleri
export interface FilterOptions {
  institutions: InstitutionInfo[];
  departments: { [key in Institution]?: string[] };
  dateRanges: Array<{
    label: string;
    start: Date;
    end: Date;
  }>;
}