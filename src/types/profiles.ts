// TypeScript interfaces for Profile Building & Evolution System

export interface RespondentProfile {
  id: string;
  phoneNumber: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;

  // Profile metadata
  displayName?: string;
  totalResponses: number;
  firstResponseDate?: Date;
  lastResponseDate?: Date;

  // Engagement metrics
  avgResponseLength: number;
  uniqueSessionsCount: number;
  responseFrequency: number; // responses per day

  // Profile status
  isActive: boolean;
  isBlocked: boolean;
  notes?: string;
}

export interface ProfileTag {
  id: string;
  profileId: string;
  tagName: string;
  tagType: 'manual' | 'auto_sentiment' | 'auto_cluster' | 'auto_behavior';
  tagValue?: string;
  createdAt: Date;
  createdBy: string; // 'system' or admin user ID
}

export interface EnhancedPollSession {
  id: string;
  title: string;
  question: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  endsAt?: Date;

  // Session settings
  allowSms: boolean;
  allowWeb: boolean;
  isActive: boolean;
  maxResponses?: number;

  // Analytics settings
  enableSentimentAnalysis: boolean;
  enableAutoClustering: boolean;
  autoTagProfiles: boolean;

  // Admin info
  createdBy?: string;
  moderatorNotes?: string;
}

export interface EnhancedResponse {
  id: string;
  sessionId: string;
  profileId?: string;

  // Response content
  textContent: string;
  originalText: string;
  wordCount: number;
  characterCount: number;

  // Response metadata
  submittedAt: Date;
  submissionMethod: 'web' | 'sms';
  clientIp?: string;
  userAgent?: string;

  // Processing status
  isProcessed: boolean;
  isModerated: boolean;
  isDeleted: boolean;
  deletedReason?: string;

  // Analytics data
  sentimentScore?: number; // -1.0 to 1.0
  sentimentLabel?: 'positive' | 'negative' | 'neutral';
  emotionScores?: Record<string, number>;
  clusterId?: string;

  // Moderation
  flaggedContent: boolean;
  flagReason?: string;
  moderatorNotes?: string;
}

export interface ResponseAnalysisHistory {
  id: string;
  responseId: string;
  analysisType: 'sentiment' | 'clustering' | 'moderation';
  analysisVersion: string;
  analysisData: Record<string, any>;
  createdAt: Date;
}

export interface WordFrequency {
  id: string;
  sessionId: string;
  word: string;
  frequency: number;
  normalizedWord: string;

  // Word metadata
  firstSeenAt: Date;
  lastSeenAt: Date;
  totalResponsesContaining: number;

  // Processing flags
  isFiltered: boolean;
  isMergedInto?: string;
  filterReason?: string;
}

export interface ProfileEvolution {
  id: string;
  profileId: string;
  sessionId: string;

  // Session-specific profile metrics
  responsesInSession: number;
  avgSentimentInSession?: number;
  wordDiversityScore?: number;
  responseTiming?: Record<string, any>;

  // Behavioral patterns
  responsePattern?: 'early_responder' | 'late_responder' | 'consistent';
  engagementLevel?: 'high' | 'medium' | 'low';
  contentSimilarityScore?: number;

  createdAt: Date;
}

export interface ClusteringResult {
  id: string;
  sessionId: string;
  clusterAlgorithm: 'kmeans' | 'hierarchical' | 'dbscan';
  clusterId: string;
  clusterName?: string;
  clusterDescription?: string;

  // Cluster characteristics
  memberCount: number;
  avgSentiment?: number;
  topKeywords?: string[];
  characteristicPhrases?: string[];

  createdAt: Date;
  algorithmVersion?: string;
}

export interface ClusterMembership {
  id: string;
  clusteringResultId: string;
  profileId: string;
  membershipStrength: number; // 0.0 to 1.0
  assignedAt: Date;
}

export interface ExportHistory {
  id: string;
  exportType: 'profile_list' | 'responses' | 'analytics';
  exportFormat: 'csv' | 'json' | 'pdf';
  filtersApplied: Record<string, any>;
  recordCount: number;
  filePath?: string;
  exportedBy: string;
  exportedAt: Date;

  // Privacy tracking
  includesPii: boolean;
  retentionPeriod?: number; // Days before auto-deletion
  accessReason?: string;
}

// Aggregated views
export interface ProfileSummary extends RespondentProfile {
  sessionsParticipated: number;
  avgSentiment?: number;
  tags: string[];
}

export interface SessionAnalytics extends EnhancedPollSession {
  uniqueParticipants: number;
  totalResponses: number;
  avgSentiment?: number;
  uniqueWords: number;
}

// Filter and search interfaces
export interface ProfileFilter {
  tags?: string[];
  sentimentRange?: [number, number];
  responseCountRange?: [number, number];
  dateRange?: [Date, Date];
  engagementLevel?: ('high' | 'medium' | 'low')[];
  isActive?: boolean;
  hasEmail?: boolean;
  searchText?: string;
}

export interface ResponseFilter {
  sessionIds?: string[];
  profileIds?: string[];
  sentimentRange?: [number, number];
  dateRange?: [Date, Date];
  submissionMethods?: ('web' | 'sms')[];
  clusters?: string[];
  flaggedOnly?: boolean;
  searchText?: string;
}

// Analytics interfaces
export interface LongitudinalInsight {
  profileId: string;
  profile: RespondentProfile;
  sessionCount: number;
  responseCount: number;
  sentimentTrend: Array<{
    sessionId: string;
    sessionDate: Date;
    avgSentiment: number;
  }>;
  topicEvolution: Array<{
    sessionId: string;
    sessionDate: Date;
    topKeywords: string[];
  }>;
  engagementPattern: 'increasing' | 'decreasing' | 'stable' | 'sporadic';
}

export interface OpinionLeaderInsight {
  profileId: string;
  profile: RespondentProfile;
  influenceScore: number; // 0.0 to 1.0
  uniqueContributions: number;
  followership: number; // How many others use similar language after them
  consistencyScore: number; // How consistent their messaging is
  topInfluentialPhrases: string[];
}

// SMS Integration interfaces
export interface SMSResponse {
  phoneNumber: string;
  messageContent: string;
  receivedAt: Date;
  sessionId?: string;
  isJoinCommand: boolean;
  isResponseCommand: boolean;
  commandType?: 'JOIN' | 'LEAVE' | 'HELP' | 'STOP';
}

export interface SMSSession {
  phoneNumber: string;
  sessionId: string;
  joinedAt: Date;
  leftAt?: Date;
  responseCount: number;
  isActive: boolean;
}

// Export interfaces
export interface ProfileExportData {
  profile: RespondentProfile;
  tags: ProfileTag[];
  responseHistory: EnhancedResponse[];
  sessionParticipation: Array<{
    sessionId: string;
    sessionTitle: string;
    participationDate: Date;
    responseCount: number;
    avgSentiment?: number;
  }>;
  clusterMemberships: Array<{
    clusterId: string;
    clusterName?: string;
    sessionId: string;
    membershipStrength: number;
  }>;
}

export interface SegmentExportData {
  segmentName: string;
  segmentCriteria: ProfileFilter;
  profiles: ProfileExportData[];
  totalProfiles: number;
  segmentInsights: {
    avgResponsesPerProfile: number;
    mostCommonTags: string[];
    sentimentDistribution: Record<string, number>;
    engagementDistribution: Record<string, number>;
  };
}