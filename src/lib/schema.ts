// Drizzle ORM Schema for Profile Building & Evolution System

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Respondent Profiles Table
export const respondentProfiles = pgTable(
  'respondent_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    // Profile metadata
    displayName: varchar('display_name', { length: 100 }),
    totalResponses: integer('total_responses').default(0).notNull(),
    firstResponseDate: timestamp('first_response_date'),
    lastResponseDate: timestamp('last_response_date'),

    // Engagement metrics
    avgResponseLength: decimal('avg_response_length', { precision: 10, scale: 2 }).default('0').notNull(),
    uniqueSessionsCount: integer('unique_sessions_count').default(0).notNull(),
    responseFrequency: decimal('response_frequency', { precision: 5, scale: 2 }).default('0').notNull(),

    // Profile status
    isActive: boolean('is_active').default(true).notNull(),
    isBlocked: boolean('is_blocked').default(false).notNull(),
    notes: text('notes'),
  },
  (table) => ({
    phoneNumberIdx: uniqueIndex('respondent_profiles_phone_number_idx').on(table.phoneNumber),
  })
);

// Profile Tags Table
export const profileTags = pgTable(
  'profile_tags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id').references(() => respondentProfiles.id, { onDelete: 'cascade' }).notNull(),
    tagName: varchar('tag_name', { length: 100 }).notNull(),
    tagType: varchar('tag_type', { length: 50 }).notNull(), // 'manual', 'auto_sentiment', 'auto_cluster', 'auto_behavior'
    tagValue: varchar('tag_value', { length: 200 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    createdBy: varchar('created_by', { length: 100 }).notNull(),
  },
  (table) => ({
    profileIdIdx: index('profile_tags_profile_id_idx').on(table.profileId),
    tagNameIdx: index('profile_tags_tag_name_idx').on(table.tagName),
    uniqueTag: uniqueIndex('unique_profile_tag').on(table.profileId, table.tagName, table.tagType),
  })
);

// Enhanced Poll Sessions Table
export const pollSessions = pgTable('poll_sessions', {
  id: varchar('id', { length: 10 }).primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  question: text('question').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  endsAt: timestamp('ends_at'),

  // Session settings
  allowSms: boolean('allow_sms').default(true).notNull(),
  allowWeb: boolean('allow_web').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  maxResponses: integer('max_responses'),

  // Analytics settings
  enableSentimentAnalysis: boolean('enable_sentiment_analysis').default(true).notNull(),
  enableAutoClustering: boolean('enable_auto_clustering').default(true).notNull(),
  autoTagProfiles: boolean('auto_tag_profiles').default(true).notNull(),

  // Admin info
  createdBy: varchar('created_by', { length: 100 }),
  moderatorNotes: text('moderator_notes'),
});

// Enhanced Responses Table
export const responses = pgTable(
  'responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: varchar('session_id', { length: 10 }).references(() => pollSessions.id, { onDelete: 'cascade' }).notNull(),
    profileId: uuid('profile_id').references(() => respondentProfiles.id, { onDelete: 'set null' }),

    // Response content
    textContent: text('text_content').notNull(),
    originalText: text('original_text').notNull(),
    wordCount: integer('word_count').notNull(),
    characterCount: integer('character_count').notNull(),

    // Response metadata
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    submissionMethod: varchar('submission_method', { length: 20 }).notNull(), // 'web', 'sms'
    clientIp: varchar('client_ip', { length: 45 }),
    userAgent: text('user_agent'),

    // Processing status
    isProcessed: boolean('is_processed').default(false).notNull(),
    isModerated: boolean('is_moderated').default(false).notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedReason: varchar('deleted_reason', { length: 200 }),

    // Analytics data
    sentimentScore: decimal('sentiment_score', { precision: 5, scale: 4 }), // -1.0 to 1.0
    sentimentLabel: varchar('sentiment_label', { length: 20 }), // 'positive', 'negative', 'neutral'
    emotionScores: jsonb('emotion_scores'),
    clusterId: varchar('cluster_id', { length: 50 }),

    // Moderation
    flaggedContent: boolean('flagged_content').default(false).notNull(),
    flagReason: varchar('flag_reason', { length: 200 }),
    moderatorNotes: text('moderator_notes'),
  },
  (table) => ({
    sessionIdIdx: index('responses_session_id_idx').on(table.sessionId),
    profileIdIdx: index('responses_profile_id_idx').on(table.profileId),
    submittedAtIdx: index('responses_submitted_at_idx').on(table.submittedAt),
  })
);

// Response Analysis History Table
export const responseAnalysisHistory = pgTable('response_analysis_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  responseId: uuid('response_id').references(() => responses.id, { onDelete: 'cascade' }).notNull(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(),
  analysisVersion: varchar('analysis_version', { length: 20 }).notNull(),
  analysisData: jsonb('analysis_data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Word Frequencies Table
export const wordFrequencies = pgTable(
  'word_frequencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: varchar('session_id', { length: 10 }).references(() => pollSessions.id, { onDelete: 'cascade' }).notNull(),
    word: varchar('word', { length: 100 }).notNull(),
    frequency: integer('frequency').default(1).notNull(),
    normalizedWord: varchar('normalized_word', { length: 100 }).notNull(),

    // Word metadata
    firstSeenAt: timestamp('first_seen_at').defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
    totalResponsesContaining: integer('total_responses_containing').default(1).notNull(),

    // Processing flags
    isFiltered: boolean('is_filtered').default(false).notNull(),
    isMergedInto: varchar('is_merged_into', { length: 100 }),
    filterReason: varchar('filter_reason', { length: 100 }),
  },
  (table) => ({
    sessionIdIdx: index('word_frequencies_session_id_idx').on(table.sessionId),
    uniqueWordPerSession: uniqueIndex('unique_word_per_session').on(table.sessionId, table.normalizedWord),
  })
);

// Profile Evolution Table
export const profileEvolution = pgTable(
  'profile_evolution',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    profileId: uuid('profile_id').references(() => respondentProfiles.id, { onDelete: 'cascade' }).notNull(),
    sessionId: varchar('session_id', { length: 10 }).references(() => pollSessions.id, { onDelete: 'cascade' }).notNull(),

    // Session-specific profile metrics
    responsesInSession: integer('responses_in_session').default(0).notNull(),
    avgSentimentInSession: decimal('avg_sentiment_in_session', { precision: 5, scale: 4 }),
    wordDiversityScore: decimal('word_diversity_score', { precision: 5, scale: 4 }),
    responseTiming: jsonb('response_timing'),

    // Behavioral patterns
    responsePattern: varchar('response_pattern', { length: 50 }),
    engagementLevel: varchar('engagement_level', { length: 50 }),
    contentSimilarityScore: decimal('content_similarity_score', { precision: 5, scale: 4 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    profileIdIdx: index('profile_evolution_profile_id_idx').on(table.profileId),
  })
);

// Clustering Results Table
export const clusteringResults = pgTable(
  'clustering_results',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: varchar('session_id', { length: 10 }).references(() => pollSessions.id, { onDelete: 'cascade' }).notNull(),
    clusterAlgorithm: varchar('cluster_algorithm', { length: 50 }).notNull(),
    clusterId: varchar('cluster_id', { length: 50 }).notNull(),
    clusterName: varchar('cluster_name', { length: 100 }),
    clusterDescription: text('cluster_description'),

    // Cluster characteristics
    memberCount: integer('member_count').notNull(),
    avgSentiment: decimal('avg_sentiment', { precision: 5, scale: 4 }),
    topKeywords: jsonb('top_keywords'),
    characteristicPhrases: jsonb('characteristic_phrases'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    algorithmVersion: varchar('algorithm_version', { length: 20 }),
  },
  (table) => ({
    uniqueCluster: uniqueIndex('unique_cluster').on(table.sessionId, table.clusterAlgorithm, table.clusterId),
  })
);

// Cluster Memberships Table
export const clusterMemberships = pgTable(
  'cluster_memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clusteringResultId: uuid('clustering_result_id').references(() => clusteringResults.id, { onDelete: 'cascade' }).notNull(),
    profileId: uuid('profile_id').references(() => respondentProfiles.id, { onDelete: 'cascade' }).notNull(),
    membershipStrength: decimal('membership_strength', { precision: 5, scale: 4 }).default('1.0').notNull(),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => ({
    profileIdIdx: index('cluster_memberships_profile_id_idx').on(table.profileId),
    uniqueMembership: uniqueIndex('unique_cluster_membership').on(table.clusteringResultId, table.profileId),
  })
);

// Export History Table
export const exportHistory = pgTable('export_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  exportType: varchar('export_type', { length: 50 }).notNull(),
  exportFormat: varchar('export_format', { length: 20 }).notNull(),
  filtersApplied: jsonb('filters_applied').notNull(),
  recordCount: integer('record_count').notNull(),
  filePath: varchar('file_path', { length: 500 }),
  exportedBy: varchar('exported_by', { length: 100 }).notNull(),
  exportedAt: timestamp('exported_at').defaultNow().notNull(),

  // Privacy tracking
  includesPii: boolean('includes_pii').default(false).notNull(),
  retentionPeriod: integer('retention_period'),
  accessReason: text('access_reason'),
});

// Define relationships
export const respondentProfilesRelations = relations(respondentProfiles, ({ many }) => ({
  tags: many(profileTags),
  responses: many(responses),
  evolution: many(profileEvolution),
  clusterMemberships: many(clusterMemberships),
}));

export const profileTagsRelations = relations(profileTags, ({ one }) => ({
  profile: one(respondentProfiles, {
    fields: [profileTags.profileId],
    references: [respondentProfiles.id],
  }),
}));

export const pollSessionsRelations = relations(pollSessions, ({ many }) => ({
  responses: many(responses),
  wordFrequencies: many(wordFrequencies),
  clusteringResults: many(clusteringResults),
  profileEvolution: many(profileEvolution),
}));

export const responsesRelations = relations(responses, ({ one, many }) => ({
  session: one(pollSessions, {
    fields: [responses.sessionId],
    references: [pollSessions.id],
  }),
  profile: one(respondentProfiles, {
    fields: [responses.profileId],
    references: [respondentProfiles.id],
  }),
  analysisHistory: many(responseAnalysisHistory),
}));

export const responseAnalysisHistoryRelations = relations(responseAnalysisHistory, ({ one }) => ({
  response: one(responses, {
    fields: [responseAnalysisHistory.responseId],
    references: [responses.id],
  }),
}));

export const wordFrequenciesRelations = relations(wordFrequencies, ({ one }) => ({
  session: one(pollSessions, {
    fields: [wordFrequencies.sessionId],
    references: [pollSessions.id],
  }),
}));

export const profileEvolutionRelations = relations(profileEvolution, ({ one }) => ({
  profile: one(respondentProfiles, {
    fields: [profileEvolution.profileId],
    references: [respondentProfiles.id],
  }),
  session: one(pollSessions, {
    fields: [profileEvolution.sessionId],
    references: [pollSessions.id],
  }),
}));

export const clusteringResultsRelations = relations(clusteringResults, ({ one, many }) => ({
  session: one(pollSessions, {
    fields: [clusteringResults.sessionId],
    references: [pollSessions.id],
  }),
  memberships: many(clusterMemberships),
}));

export const clusterMembershipsRelations = relations(clusterMemberships, ({ one }) => ({
  clusteringResult: one(clusteringResults, {
    fields: [clusterMemberships.clusteringResultId],
    references: [clusteringResults.id],
  }),
  profile: one(respondentProfiles, {
    fields: [clusterMemberships.profileId],
    references: [respondentProfiles.id],
  }),
}));