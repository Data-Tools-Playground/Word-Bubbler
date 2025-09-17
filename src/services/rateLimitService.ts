// Rate Limiting Service - Spam prevention and throttle controls for SMS and web responses

import { db } from '@/lib/database';
import { responses } from '@/lib/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface ThrottleRule {
  id: string;
  name: string;
  enabled: boolean;

  // Time-based limits
  maxResponsesPerMinute: number;
  maxResponsesPerHour: number;
  maxResponsesPerDay: number;

  // Content-based limits
  duplicateContentWindow: number; // minutes to check for duplicates
  minResponseLength: number;
  maxResponseLength: number;

  // Profile-based limits
  maxResponsesPerSessionPerProfile: number;
  cooldownBetweenResponses: number; // seconds

  // Penalties
  violationCooldown: number; // minutes
  maxViolationsBeforeBlock: number;

  // Special rules
  allowedPhonePatterns?: string[]; // Regex patterns for whitelisted numbers
  blockedPhonePatterns?: string[]; // Regex patterns for blocked numbers

  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitViolation {
  id: string;
  profileId: string;
  phoneNumber: string;
  violationType: 'rate_limit' | 'duplicate_content' | 'length_violation' | 'cooldown_violation';
  violationData: Record<string, any>;
  timestamp: Date;
  ruleName: string;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  violationType?: string;
  waitTime?: number; // seconds until next allowed response
  details?: Record<string, any>;
}

export class RateLimitService {
  private static cache = new Map<string, any>(); // In-memory cache for performance
  private static cacheExpiry = new Map<string, number>();

  // Default throttle rules
  private static defaultRules: Omit<ThrottleRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'SMS Standard Rate Limit',
      enabled: true,
      maxResponsesPerMinute: 3,
      maxResponsesPerHour: 15,
      maxResponsesPerDay: 50,
      duplicateContentWindow: 5,
      minResponseLength: 1,
      maxResponseLength: 500,
      maxResponsesPerSessionPerProfile: 10,
      cooldownBetweenResponses: 10,
      violationCooldown: 5,
      maxViolationsBeforeBlock: 5,
    },
    {
      name: 'Web Standard Rate Limit',
      enabled: true,
      maxResponsesPerMinute: 5,
      maxResponsesPerHour: 30,
      maxResponsesPerDay: 100,
      duplicateContentWindow: 2,
      minResponseLength: 1,
      maxResponseLength: 1000,
      maxResponsesPerSessionPerProfile: 20,
      cooldownBetweenResponses: 5,
      violationCooldown: 3,
      maxViolationsBeforeBlock: 10,
    },
    {
      name: 'VIP Rate Limit',
      enabled: false,
      maxResponsesPerMinute: 10,
      maxResponsesPerHour: 100,
      maxResponsesPerDay: 500,
      duplicateContentWindow: 1,
      minResponseLength: 1,
      maxResponseLength: 2000,
      maxResponsesPerSessionPerProfile: 50,
      cooldownBetweenResponses: 2,
      violationCooldown: 1,
      maxViolationsBeforeBlock: 20,
      allowedPhonePatterns: ['^\\+1555'], // Example VIP numbers
    },
  ];

  // Check if a response is allowed
  static async checkRateLimit(
    profileId: string,
    phoneNumber: string,
    sessionId: string,
    responseText: string,
    submissionMethod: 'sms' | 'web'
  ): Promise<RateLimitResult> {
    try {
      // Get applicable throttle rules
      const rules = await this.getApplicableRules(phoneNumber, submissionMethod);

      for (const rule of rules) {
        const result = await this.checkAgainstRule(
          rule,
          profileId,
          phoneNumber,
          sessionId,
          responseText,
          submissionMethod
        );

        if (!result.allowed) {
          // Log violation
          await this.logViolation(profileId, phoneNumber, result, rule.name);
          return result;
        }
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow response if rate limiting fails
      return { allowed: true };
    }
  }

  // Check against a specific rule
  private static async checkAgainstRule(
    rule: ThrottleRule,
    profileId: string,
    phoneNumber: string,
    sessionId: string,
    responseText: string,
    submissionMethod: 'sms' | 'web'
  ): Promise<RateLimitResult> {
    const now = new Date();

    // 1. Check content length
    if (responseText.length < rule.minResponseLength) {
      return {
        allowed: false,
        reason: `Response too short. Minimum ${rule.minResponseLength} characters required.`,
        violationType: 'length_violation',
        details: { minLength: rule.minResponseLength, actualLength: responseText.length }
      };
    }

    if (responseText.length > rule.maxResponseLength) {
      return {
        allowed: false,
        reason: `Response too long. Maximum ${rule.maxResponseLength} characters allowed.`,
        violationType: 'length_violation',
        details: { maxLength: rule.maxResponseLength, actualLength: responseText.length }
      };
    }

    // 2. Check for recent violations and cooldowns
    const recentViolations = await this.getRecentViolations(profileId, rule.violationCooldown);
    if (recentViolations.length >= rule.maxViolationsBeforeBlock) {
      return {
        allowed: false,
        reason: 'Too many recent violations. Please wait before submitting again.',
        violationType: 'cooldown_violation',
        waitTime: rule.violationCooldown * 60,
        details: { violations: recentViolations.length, maxAllowed: rule.maxViolationsBeforeBlock }
      };
    }

    // 3. Check cooldown between responses
    const lastResponse = await this.getLastResponse(profileId);
    if (lastResponse) {
      const timeSinceLastResponse = (now.getTime() - lastResponse.submittedAt.getTime()) / 1000;
      if (timeSinceLastResponse < rule.cooldownBetweenResponses) {
        const waitTime = rule.cooldownBetweenResponses - timeSinceLastResponse;
        return {
          allowed: false,
          reason: `Please wait ${Math.ceil(waitTime)} seconds before submitting another response.`,
          violationType: 'cooldown_violation',
          waitTime: Math.ceil(waitTime),
          details: { cooldownSeconds: rule.cooldownBetweenResponses }
        };
      }
    }

    // 4. Check rate limits (per minute, hour, day)
    const minuteLimit = await this.checkTimeBasedLimit(profileId, rule.maxResponsesPerMinute, 1);
    if (!minuteLimit.allowed) {
      return {
        allowed: false,
        reason: `Rate limit exceeded. Maximum ${rule.maxResponsesPerMinute} responses per minute.`,
        violationType: 'rate_limit',
        waitTime: 60,
        details: { limit: rule.maxResponsesPerMinute, period: 'minute' }
      };
    }

    const hourLimit = await this.checkTimeBasedLimit(profileId, rule.maxResponsesPerHour, 60);
    if (!hourLimit.allowed) {
      return {
        allowed: false,
        reason: `Rate limit exceeded. Maximum ${rule.maxResponsesPerHour} responses per hour.`,
        violationType: 'rate_limit',
        waitTime: 3600,
        details: { limit: rule.maxResponsesPerHour, period: 'hour' }
      };
    }

    const dayLimit = await this.checkTimeBasedLimit(profileId, rule.maxResponsesPerDay, 1440);
    if (!dayLimit.allowed) {
      return {
        allowed: false,
        reason: `Daily limit reached. Maximum ${rule.maxResponsesPerDay} responses per day.`,
        violationType: 'rate_limit',
        waitTime: 86400,
        details: { limit: rule.maxResponsesPerDay, period: 'day' }
      };
    }

    // 5. Check session-specific limits
    const sessionResponseCount = await this.getSessionResponseCount(profileId, sessionId);
    if (sessionResponseCount >= rule.maxResponsesPerSessionPerProfile) {
      return {
        allowed: false,
        reason: `Session limit reached. Maximum ${rule.maxResponsesPerSessionPerProfile} responses per session.`,
        violationType: 'rate_limit',
        details: { limit: rule.maxResponsesPerSessionPerProfile, current: sessionResponseCount }
      };
    }

    // 6. Check for duplicate content
    const duplicateCheck = await this.checkDuplicateContent(
      profileId,
      responseText,
      rule.duplicateContentWindow
    );
    if (!duplicateCheck.allowed) {
      return {
        allowed: false,
        reason: 'Duplicate or very similar content detected. Please submit a different response.',
        violationType: 'duplicate_content',
        details: { windowMinutes: rule.duplicateContentWindow }
      };
    }

    return { allowed: true };
  }

  // Get applicable throttle rules for a phone number and submission method
  private static async getApplicableRules(
    phoneNumber: string,
    submissionMethod: 'sms' | 'web'
  ): Promise<ThrottleRule[]> {
    // For now, use default rules based on submission method
    // In production, this would query the database for custom rules

    const rules = this.defaultRules.filter(rule => {
      if (!rule.enabled) return false;

      // Check phone number patterns
      if (rule.allowedPhonePatterns) {
        return rule.allowedPhonePatterns.some(pattern =>
          new RegExp(pattern).test(phoneNumber)
        );
      }

      if (rule.blockedPhonePatterns) {
        const isBlocked = rule.blockedPhonePatterns.some(pattern =>
          new RegExp(pattern).test(phoneNumber)
        );
        if (isBlocked) return false;
      }

      // Default rule selection based on submission method
      if (submissionMethod === 'sms' && rule.name.includes('SMS')) return true;
      if (submissionMethod === 'web' && rule.name.includes('Web')) return true;

      return false;
    });

    // Convert to ThrottleRule format (add missing fields)
    return rules.map(rule => ({
      ...rule,
      id: `default-${rule.name.toLowerCase().replace(/\s+/g, '-')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  // Check time-based limits (minute, hour, day)
  private static async checkTimeBasedLimit(
    profileId: string,
    maxResponses: number,
    periodMinutes: number
  ): Promise<{ allowed: boolean; current: number }> {
    const cacheKey = `time-limit-${profileId}-${periodMinutes}`;

    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > Date.now()) {
      const cached = this.cache.get(cacheKey);
      return { allowed: cached.count < maxResponses, current: cached.count };
    }

    const since = new Date(Date.now() - (periodMinutes * 60 * 1000));

    const responseCount = await db
      .select()
      .from(responses)
      .where(
        and(
          eq(responses.profileId, profileId),
          gte(responses.submittedAt, since),
          eq(responses.isDeleted, false)
        )
      );

    const count = responseCount.length;

    // Cache for 1 minute
    this.cache.set(cacheKey, { count });
    this.cacheExpiry.set(cacheKey, Date.now() + 60000);

    return { allowed: count < maxResponses, current: count };
  }

  // Check for duplicate content
  private static async checkDuplicateContent(
    profileId: string,
    responseText: string,
    windowMinutes: number
  ): Promise<{ allowed: boolean }> {
    const since = new Date(Date.now() - (windowMinutes * 60 * 1000));
    const normalizedText = responseText.toLowerCase().trim();

    const recentResponses = await db
      .select()
      .from(responses)
      .where(
        and(
          eq(responses.profileId, profileId),
          gte(responses.submittedAt, since),
          eq(responses.isDeleted, false)
        )
      )
      .orderBy(desc(responses.submittedAt))
      .limit(10);

    // Check for exact duplicates or very similar content
    for (const response of recentResponses) {
      const existingText = response.textContent.toLowerCase().trim();

      // Exact match
      if (existingText === normalizedText) {
        return { allowed: false };
      }

      // Very similar content (simple similarity check)
      const similarity = this.calculateSimilarity(normalizedText, existingText);
      if (similarity > 0.9) {
        return { allowed: false };
      }
    }

    return { allowed: true };
  }

  // Simple text similarity calculation
  private static calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  // Get recent violations for a profile
  private static async getRecentViolations(
    profileId: string,
    windowMinutes: number
  ): Promise<RateLimitViolation[]> {
    // In a real implementation, this would query a violations table
    // For now, return empty array
    return [];
  }

  // Get last response for a profile
  private static async getLastResponse(profileId: string): Promise<any> {
    const lastResponse = await db
      .select()
      .from(responses)
      .where(
        and(
          eq(responses.profileId, profileId),
          eq(responses.isDeleted, false)
        )
      )
      .orderBy(desc(responses.submittedAt))
      .limit(1);

    return lastResponse.length > 0 ? lastResponse[0] : null;
  }

  // Get response count for a specific session
  private static async getSessionResponseCount(
    profileId: string,
    sessionId: string
  ): Promise<number> {
    const sessionResponses = await db
      .select()
      .from(responses)
      .where(
        and(
          eq(responses.profileId, profileId),
          eq(responses.sessionId, sessionId),
          eq(responses.isDeleted, false)
        )
      );

    return sessionResponses.length;
  }

  // Log a rate limit violation
  private static async logViolation(
    profileId: string,
    phoneNumber: string,
    result: RateLimitResult,
    ruleName: string
  ): Promise<void> {
    // In a real implementation, this would insert into a violations table
    console.log('Rate limit violation:', {
      profileId,
      phoneNumber,
      violationType: result.violationType,
      reason: result.reason,
      ruleName,
      timestamp: new Date(),
    });
  }

  // Clear cache (for testing or manual reset)
  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Get rate limit status for a profile
  static async getRateLimitStatus(
    profileId: string,
    phoneNumber: string,
    submissionMethod: 'sms' | 'web'
  ): Promise<{
    canSubmit: boolean;
    limits: Array<{
      type: string;
      current: number;
      limit: number;
      resetsAt?: Date;
    }>;
    violations: RateLimitViolation[];
  }> {
    const rules = await this.getApplicableRules(phoneNumber, submissionMethod);
    const limits = [];
    let canSubmit = true;

    if (rules.length > 0) {
      const rule = rules[0]; // Use first applicable rule

      // Check each limit type
      const minuteCheck = await this.checkTimeBasedLimit(profileId, rule.maxResponsesPerMinute, 1);
      limits.push({
        type: 'per_minute',
        current: minuteCheck.current,
        limit: rule.maxResponsesPerMinute,
        resetsAt: new Date(Date.now() + 60000)
      });

      const hourCheck = await this.checkTimeBasedLimit(profileId, rule.maxResponsesPerHour, 60);
      limits.push({
        type: 'per_hour',
        current: hourCheck.current,
        limit: rule.maxResponsesPerHour,
        resetsAt: new Date(Date.now() + 3600000)
      });

      const dayCheck = await this.checkTimeBasedLimit(profileId, rule.maxResponsesPerDay, 1440);
      limits.push({
        type: 'per_day',
        current: dayCheck.current,
        limit: rule.maxResponsesPerDay,
        resetsAt: new Date(Date.now() + 86400000)
      });

      canSubmit = minuteCheck.allowed && hourCheck.allowed && dayCheck.allowed;
    }

    const violations = await this.getRecentViolations(profileId, 60); // Last hour

    return {
      canSubmit,
      limits,
      violations
    };
  }
}