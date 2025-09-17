// Profile Service Layer - Core business logic for profile building & evolution

import { eq, sql, and, desc, asc, inArray, gte, lte, like, isNull, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/database';
import {
  respondentProfiles,
  profileTags,
  responses,
  profileEvolution,
  clusterMemberships,
  pollSessions,
  wordFrequencies,
} from '@/lib/schema';
import {
  RespondentProfile,
  ProfileTag,
  EnhancedResponse,
  ProfileFilter,
  ProfileSummary,
  LongitudinalInsight,
  OpinionLeaderInsight,
  ProfileExportData,
} from '@/types/profiles';

export class ProfileService {
  // Create or get existing profile by phone number
  static async getOrCreateProfile(phoneNumber: string): Promise<RespondentProfile> {
    try {
      // Try to find existing profile
      const existing = await db
        .select()
        .from(respondentProfiles)
        .where(eq(respondentProfiles.phoneNumber, phoneNumber))
        .limit(1);

      if (existing.length > 0) {
        return existing[0] as RespondentProfile;
      }

      // Create new profile
      const newProfile = await db
        .insert(respondentProfiles)
        .values({
          phoneNumber,
          displayName: this.generateDisplayName(phoneNumber),
          isActive: true,
        })
        .returning();

      return newProfile[0] as RespondentProfile;
    } catch (error) {
      console.error('Error in getOrCreateProfile:', error);
      throw new Error('Failed to get or create profile');
    }
  }

  // Update profile when new response is added
  static async updateProfileMetrics(profileId: string, responseText: string): Promise<void> {
    try {
      const profile = await db
        .select()
        .from(respondentProfiles)
        .where(eq(respondentProfiles.id, profileId))
        .limit(1);

      if (profile.length === 0) return;

      const currentProfile = profile[0];
      const responseLength = responseText.length;
      const newTotalResponses = currentProfile.totalResponses + 1;
      const newAvgLength =
        (parseFloat(currentProfile.avgResponseLength.toString()) * currentProfile.totalResponses + responseLength) / newTotalResponses;

      await db
        .update(respondentProfiles)
        .set({
          totalResponses: newTotalResponses,
          avgResponseLength: newAvgLength.toString(),
          lastResponseDate: new Date(),
          firstResponseDate: currentProfile.firstResponseDate || new Date(),
          updatedAt: new Date(),
        })
        .where(eq(respondentProfiles.id, profileId));
    } catch (error) {
      console.error('Error updating profile metrics:', error);
      throw new Error('Failed to update profile metrics');
    }
  }

  // Add tag to profile
  static async addProfileTag(
    profileId: string,
    tagName: string,
    tagType: 'manual' | 'auto_sentiment' | 'auto_cluster' | 'auto_behavior',
    tagValue?: string,
    createdBy: string = 'system'
  ): Promise<ProfileTag> {
    try {
      const newTag = await db
        .insert(profileTags)
        .values({
          profileId,
          tagName,
          tagType,
          tagValue,
          createdBy,
        })
        .returning();

      return newTag[0] as ProfileTag;
    } catch (error) {
      console.error('Error adding profile tag:', error);
      throw new Error('Failed to add profile tag');
    }
  }

  // Remove tag from profile
  static async removeProfileTag(profileId: string, tagName: string, tagType: string): Promise<void> {
    try {
      await db
        .delete(profileTags)
        .where(
          and(
            eq(profileTags.profileId, profileId),
            eq(profileTags.tagName, tagName),
            eq(profileTags.tagType, tagType)
          )
        );
    } catch (error) {
      console.error('Error removing profile tag:', error);
      throw new Error('Failed to remove profile tag');
    }
  }

  // Get profiles with filters
  static async getProfiles(filter: ProfileFilter): Promise<ProfileSummary[]> {
    try {
      let query = db
        .select({
          profile: respondentProfiles,
          responseCount: sql<number>`COUNT(DISTINCT ${responses.id})`,
          sessionCount: sql<number>`COUNT(DISTINCT ${responses.sessionId})`,
          avgSentiment: sql<number>`AVG(${responses.sentimentScore})`,
        })
        .from(respondentProfiles)
        .leftJoin(responses, eq(respondentProfiles.id, responses.profileId))
        .leftJoin(profileTags, eq(respondentProfiles.id, profileTags.profileId))
        .groupBy(respondentProfiles.id);

      // Apply filters
      const conditions = [];

      if (filter.isActive !== undefined) {
        conditions.push(eq(respondentProfiles.isActive, filter.isActive));
      }

      if (filter.hasEmail !== undefined) {
        conditions.push(filter.hasEmail ? isNotNull(respondentProfiles.email) : isNull(respondentProfiles.email));
      }

      if (filter.responseCountRange) {
        conditions.push(gte(respondentProfiles.totalResponses, filter.responseCountRange[0]));
        conditions.push(lte(respondentProfiles.totalResponses, filter.responseCountRange[1]));
      }

      if (filter.searchText) {
        conditions.push(
          sql`(${respondentProfiles.displayName} ILIKE ${`%${filter.searchText}%`} OR
               ${respondentProfiles.phoneNumber} LIKE ${`%${filter.searchText}%`})`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query.execute();

      // Get tags for each profile
      const profileIds = results.map(r => r.profile.id);
      const tags = await db
        .select()
        .from(profileTags)
        .where(inArray(profileTags.profileId, profileIds));

      // Combine results
      return results.map(result => ({
        ...result.profile,
        sessionsParticipated: result.sessionCount,
        avgSentiment: result.avgSentiment,
        tags: tags
          .filter(tag => tag.profileId === result.profile.id)
          .map(tag => tag.tagName),
      } as ProfileSummary));
    } catch (error) {
      console.error('Error getting profiles:', error);
      throw new Error('Failed to get profiles');
    }
  }

  // Get longitudinal insights for a profile
  static async getLongitudinalInsights(profileId: string): Promise<LongitudinalInsight | null> {
    try {
      const profile = await db
        .select()
        .from(respondentProfiles)
        .where(eq(respondentProfiles.id, profileId))
        .limit(1);

      if (profile.length === 0) return null;

      // Get evolution data
      const evolution = await db
        .select({
          evolution: profileEvolution,
          session: pollSessions,
        })
        .from(profileEvolution)
        .innerJoin(pollSessions, eq(profileEvolution.sessionId, pollSessions.id))
        .where(eq(profileEvolution.profileId, profileId))
        .orderBy(asc(pollSessions.createdAt));

      // Get response data for trend analysis
      const responseData = await db
        .select({
          sessionId: responses.sessionId,
          sessionDate: pollSessions.createdAt,
          sentimentScore: responses.sentimentScore,
          textContent: responses.textContent,
        })
        .from(responses)
        .innerJoin(pollSessions, eq(responses.sessionId, pollSessions.id))
        .where(eq(responses.profileId, profileId))
        .orderBy(asc(pollSessions.createdAt));

      // Calculate sentiment trend
      const sentimentTrend = evolution.map(e => ({
        sessionId: e.evolution.sessionId,
        sessionDate: e.session.createdAt,
        avgSentiment: parseFloat(e.evolution.avgSentimentInSession?.toString() || '0'),
      }));

      // Calculate engagement pattern
      const engagementPattern = this.calculateEngagementPattern(evolution);

      return {
        profileId,
        profile: profile[0] as RespondentProfile,
        sessionCount: evolution.length,
        responseCount: responseData.length,
        sentimentTrend,
        topicEvolution: [], // TODO: Implement topic analysis
        engagementPattern,
      };
    } catch (error) {
      console.error('Error getting longitudinal insights:', error);
      throw new Error('Failed to get longitudinal insights');
    }
  }

  // Get opinion leader insights
  static async getOpinionLeaderInsights(sessionId?: string): Promise<OpinionLeaderInsight[]> {
    try {
      // Complex query to identify opinion leaders
      // This is a simplified version - in production, you'd use more sophisticated algorithms
      const query = db
        .select({
          profile: respondentProfiles,
          responseCount: sql<number>`COUNT(${responses.id})`,
          avgSentiment: sql<number>`AVG(${responses.sentimentScore})`,
          uniqueWords: sql<number>`COUNT(DISTINCT ${wordFrequencies.normalizedWord})`,
        })
        .from(respondentProfiles)
        .innerJoin(responses, eq(respondentProfiles.id, responses.profileId))
        .leftJoin(wordFrequencies, eq(responses.sessionId, wordFrequencies.sessionId))
        .groupBy(respondentProfiles.id)
        .having(sql`COUNT(${responses.id}) >= 3`) // Must have at least 3 responses
        .orderBy(desc(sql`COUNT(${responses.id})`));

      if (sessionId) {
        query.where(eq(responses.sessionId, sessionId));
      }

      const results = await query.execute();

      return results.map(result => ({
        profileId: result.profile.id,
        profile: result.profile as RespondentProfile,
        influenceScore: this.calculateInfluenceScore(result),
        uniqueContributions: result.uniqueWords,
        followership: 0, // TODO: Implement followership calculation
        consistencyScore: Math.abs(result.avgSentiment || 0), // Simplified consistency metric
        topInfluentialPhrases: [], // TODO: Implement phrase analysis
      }));
    } catch (error) {
      console.error('Error getting opinion leader insights:', error);
      throw new Error('Failed to get opinion leader insights');
    }
  }

  // Export profile data
  static async exportProfileData(profileIds: string[]): Promise<ProfileExportData[]> {
    try {
      const exportData: ProfileExportData[] = [];

      for (const profileId of profileIds) {
        const profile = await db
          .select()
          .from(respondentProfiles)
          .where(eq(respondentProfiles.id, profileId))
          .limit(1);

        if (profile.length === 0) continue;

        const tags = await db
          .select()
          .from(profileTags)
          .where(eq(profileTags.profileId, profileId));

        const responseHistory = await db
          .select()
          .from(responses)
          .where(eq(responses.profileId, profileId))
          .orderBy(desc(responses.submittedAt));

        const sessionParticipation = await db
          .select({
            sessionId: responses.sessionId,
            sessionTitle: pollSessions.title,
            participationDate: sql<Date>`MIN(${responses.submittedAt})`,
            responseCount: sql<number>`COUNT(${responses.id})`,
            avgSentiment: sql<number>`AVG(${responses.sentimentScore})`,
          })
          .from(responses)
          .innerJoin(pollSessions, eq(responses.sessionId, pollSessions.id))
          .where(eq(responses.profileId, profileId))
          .groupBy(responses.sessionId, pollSessions.title);

        const clusterMembershipsData = await db
          .select()
          .from(clusterMemberships)
          .where(eq(clusterMemberships.profileId, profileId));

        exportData.push({
          profile: profile[0] as RespondentProfile,
          tags: tags as ProfileTag[],
          responseHistory: responseHistory as EnhancedResponse[],
          sessionParticipation,
          clusterMemberships: clusterMembershipsData.map(cm => ({
            clusterId: cm.clusteringResultId,
            clusterName: null, // TODO: Join with clustering_results
            sessionId: '', // TODO: Join with clustering_results
            membershipStrength: parseFloat(cm.membershipStrength.toString()),
          })),
        });
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting profile data:', error);
      throw new Error('Failed to export profile data');
    }
  }

  // Helper methods
  private static generateDisplayName(phoneNumber: string): string {
    const last4 = phoneNumber.slice(-4);
    return `User-${last4}`;
  }

  private static calculateEngagementPattern(evolution: any[]): 'increasing' | 'decreasing' | 'stable' | 'sporadic' {
    if (evolution.length < 2) return 'stable';

    const responseCounts = evolution.map(e => e.evolution.responsesInSession);
    const trend = responseCounts[responseCounts.length - 1] - responseCounts[0];

    if (Math.abs(trend) < 1) return 'stable';
    return trend > 0 ? 'increasing' : 'decreasing';
  }

  private static calculateInfluenceScore(data: any): number {
    // Simplified influence score based on response count and unique words
    const responseWeight = Math.min(data.responseCount / 10, 1); // Max weight at 10 responses
    const uniquenessWeight = Math.min(data.uniqueWords / 50, 1); // Max weight at 50 unique words
    return (responseWeight + uniquenessWeight) / 2;
  }
}