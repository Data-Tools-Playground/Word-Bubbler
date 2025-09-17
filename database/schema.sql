-- Profile Building & Evolution Database Schema
-- Supports persistent participant profiles, response history, and segmentation

-- Respondent Profiles Table
CREATE TABLE respondent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) UNIQUE NOT NULL, -- Primary identifier (SMS integration)
  email VARCHAR(255), -- Optional secondary identifier
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Profile metadata
  display_name VARCHAR(100), -- Auto-generated or manually set
  total_responses INTEGER DEFAULT 0,
  first_response_date TIMESTAMP,
  last_response_date TIMESTAMP,

  -- Engagement metrics
  avg_response_length DECIMAL(10,2) DEFAULT 0,
  unique_sessions_count INTEGER DEFAULT 0,
  response_frequency DECIMAL(5,2) DEFAULT 0, -- responses per day

  -- Profile status
  is_active BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  notes TEXT -- Admin notes about the respondent
);

-- Profile Tags Table (many-to-many relationship)
CREATE TABLE profile_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES respondent_profiles(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  tag_type VARCHAR(50) NOT NULL, -- 'manual', 'auto_sentiment', 'auto_cluster', 'auto_behavior'
  tag_value VARCHAR(200), -- Additional tag data (e.g., sentiment score, cluster ID)
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100), -- 'system' or admin user ID

  UNIQUE(profile_id, tag_name, tag_type)
);

-- Enhanced Poll Sessions Table
CREATE TABLE poll_sessions (
  id VARCHAR(10) PRIMARY KEY, -- Short session ID for sharing
  title VARCHAR(200) NOT NULL,
  question TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ends_at TIMESTAMP, -- Optional session end time

  -- Session settings
  allow_sms BOOLEAN DEFAULT true,
  allow_web BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  max_responses INTEGER, -- Optional response limit

  -- Analytics settings
  enable_sentiment_analysis BOOLEAN DEFAULT true,
  enable_auto_clustering BOOLEAN DEFAULT true,
  auto_tag_profiles BOOLEAN DEFAULT true,

  -- Admin info
  created_by VARCHAR(100), -- Admin user ID
  moderator_notes TEXT
);

-- Enhanced Responses Table with Profile Linking
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(10) REFERENCES poll_sessions(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES respondent_profiles(id) ON DELETE SET NULL,

  -- Response content
  text_content TEXT NOT NULL,
  original_text TEXT NOT NULL, -- Store original before any processing
  word_count INTEGER NOT NULL,
  character_count INTEGER NOT NULL,

  -- Response metadata
  submitted_at TIMESTAMP DEFAULT NOW(),
  submission_method VARCHAR(20) NOT NULL, -- 'web', 'sms'
  client_ip VARCHAR(45), -- For web submissions
  user_agent TEXT, -- For web submissions

  -- Processing status
  is_processed BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  deleted_reason VARCHAR(200),

  -- Analytics data
  sentiment_score DECIMAL(5,4), -- -1.0 to 1.0
  sentiment_label VARCHAR(20), -- 'positive', 'negative', 'neutral'
  emotion_scores JSONB, -- Detailed emotion analysis
  cluster_id VARCHAR(50), -- Auto-assigned cluster

  -- Moderation
  flagged_content BOOLEAN DEFAULT false,
  flag_reason VARCHAR(200),
  moderator_notes TEXT
);

-- Response Processing History (track all analysis iterations)
CREATE TABLE response_analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL, -- 'sentiment', 'clustering', 'moderation'
  analysis_version VARCHAR(20) NOT NULL, -- Track different algorithm versions
  analysis_data JSONB NOT NULL, -- Store complete analysis results
  created_at TIMESTAMP DEFAULT NOW()
);

-- Word Frequency Tracking (for word cloud generation)
CREATE TABLE word_frequencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(10) REFERENCES poll_sessions(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  frequency INTEGER NOT NULL DEFAULT 1,
  normalized_word VARCHAR(100) NOT NULL, -- Stemmed/lemmatized version

  -- Word metadata
  first_seen_at TIMESTAMP DEFAULT NOW(),
  last_seen_at TIMESTAMP DEFAULT NOW(),
  total_responses_containing INTEGER DEFAULT 1,

  -- Processing flags
  is_filtered BOOLEAN DEFAULT false, -- Manually filtered out
  is_merged_into VARCHAR(100), -- If merged with another word
  filter_reason VARCHAR(100),

  UNIQUE(session_id, normalized_word)
);

-- Profile Evolution Tracking (longitudinal insights)
CREATE TABLE profile_evolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES respondent_profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(10) REFERENCES poll_sessions(id) ON DELETE CASCADE,

  -- Session-specific profile metrics
  responses_in_session INTEGER DEFAULT 0,
  avg_sentiment_in_session DECIMAL(5,4),
  word_diversity_score DECIMAL(5,4), -- Unique words / total words
  response_timing JSONB, -- Timestamps of responses within session

  -- Behavioral patterns
  response_pattern VARCHAR(50), -- 'early_responder', 'late_responder', 'consistent'
  engagement_level VARCHAR(50), -- 'high', 'medium', 'low'
  content_similarity_score DECIMAL(5,4), -- Similarity to own previous responses

  created_at TIMESTAMP DEFAULT NOW()
);

-- Clustering Results (store participant groupings)
CREATE TABLE clustering_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(10) REFERENCES poll_sessions(id) ON DELETE CASCADE,
  cluster_algorithm VARCHAR(50) NOT NULL, -- 'kmeans', 'hierarchical', 'dbscan'
  cluster_id VARCHAR(50) NOT NULL,
  cluster_name VARCHAR(100), -- Human-readable cluster name
  cluster_description TEXT,

  -- Cluster characteristics
  member_count INTEGER NOT NULL,
  avg_sentiment DECIMAL(5,4),
  top_keywords JSONB, -- Array of most common words
  characteristic_phrases JSONB, -- Phrases that define this cluster

  created_at TIMESTAMP DEFAULT NOW(),
  algorithm_version VARCHAR(20),

  UNIQUE(session_id, cluster_algorithm, cluster_id)
);

-- Cluster Membership (many-to-many: profiles can be in multiple clusters)
CREATE TABLE cluster_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clustering_result_id UUID REFERENCES clustering_results(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES respondent_profiles(id) ON DELETE CASCADE,
  membership_strength DECIMAL(5,4) DEFAULT 1.0, -- How strongly they belong to cluster
  assigned_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(clustering_result_id, profile_id)
);

-- Export History (track data exports for compliance)
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type VARCHAR(50) NOT NULL, -- 'profile_list', 'responses', 'analytics'
  export_format VARCHAR(20) NOT NULL, -- 'csv', 'json', 'pdf'
  filters_applied JSONB NOT NULL, -- Store filter criteria used
  record_count INTEGER NOT NULL,
  file_path VARCHAR(500), -- Where file was saved/served
  exported_by VARCHAR(100), -- Admin user ID
  exported_at TIMESTAMP DEFAULT NOW(),

  -- Privacy tracking
  includes_pii BOOLEAN DEFAULT false,
  retention_period INTEGER, -- Days before auto-deletion
  access_reason TEXT -- Business justification for export
);

-- Indexes for performance
CREATE INDEX idx_responses_session_id ON responses(session_id);
CREATE INDEX idx_responses_profile_id ON responses(profile_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at);
CREATE INDEX idx_profile_tags_profile_id ON profile_tags(profile_id);
CREATE INDEX idx_profile_tags_tag_name ON profile_tags(tag_name);
CREATE INDEX idx_word_frequencies_session_id ON word_frequencies(session_id);
CREATE INDEX idx_cluster_memberships_profile_id ON cluster_memberships(profile_id);
CREATE INDEX idx_respondent_profiles_phone_number ON respondent_profiles(phone_number);
CREATE INDEX idx_profile_evolution_profile_id ON profile_evolution(profile_id);

-- Views for common queries
CREATE VIEW profile_summary AS
SELECT
  rp.*,
  COUNT(DISTINCT r.session_id) as sessions_participated,
  COUNT(r.id) as total_responses,
  AVG(r.sentiment_score) as avg_sentiment,
  ARRAY_AGG(DISTINCT pt.tag_name) as tags
FROM respondent_profiles rp
LEFT JOIN responses r ON rp.id = r.profile_id AND r.is_deleted = false
LEFT JOIN profile_tags pt ON rp.id = pt.profile_id
GROUP BY rp.id;

CREATE VIEW session_analytics AS
SELECT
  ps.*,
  COUNT(DISTINCT r.profile_id) as unique_participants,
  COUNT(r.id) as total_responses,
  AVG(r.sentiment_score) as avg_sentiment,
  COUNT(DISTINCT wf.normalized_word) as unique_words
FROM poll_sessions ps
LEFT JOIN responses r ON ps.id = r.session_id AND r.is_deleted = false
LEFT JOIN word_frequencies wf ON ps.id = wf.session_id AND wf.is_filtered = false
GROUP BY ps.id;