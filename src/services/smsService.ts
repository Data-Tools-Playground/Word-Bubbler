// SMS Service Layer - Profile-linked SMS integration with Twilio

import { Twilio } from 'twilio';
import { ProfileService } from './profileService';
import { db } from '@/lib/database';
import { responses, pollSessions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { SMSResponse, SMSSession } from '@/types/profiles';

export class SMSService {
  private static client: Twilio | null = null;
  private static activeSessions = new Map<string, SMSSession>(); // phoneNumber -> SMSSession

  // Initialize Twilio client
  static initialize(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured. SMS functionality disabled.');
      return;
    }

    this.client = new Twilio(accountSid, authToken);
    console.log('SMS Service initialized with Twilio');
  }

  // Process incoming SMS webhook from Twilio
  static async processIncomingSMS(
    phoneNumber: string,
    messageBody: string,
    twilioData: any
  ): Promise<{ success: boolean; reply?: string; error?: string }> {
    try {
      const smsResponse = this.parseIncomingMessage(phoneNumber, messageBody);

      // Get or create profile for this phone number
      const profile = await ProfileService.getOrCreateProfile(phoneNumber);

      if (smsResponse.isJoinCommand) {
        return await this.handleJoinCommand(smsResponse, profile.id);
      } else if (smsResponse.commandType === 'LEAVE') {
        return await this.handleLeaveCommand(smsResponse);
      } else if (smsResponse.commandType === 'HELP') {
        return await this.handleHelpCommand();
      } else if (smsResponse.commandType === 'STOP') {
        return await this.handleStopCommand(smsResponse);
      } else if (smsResponse.isResponseCommand) {
        return await this.handleResponseSubmission(smsResponse, profile.id);
      } else {
        return await this.handleUnknownCommand();
      }
    } catch (error) {
      console.error('Error processing SMS:', error);
      return {
        success: false,
        error: 'Failed to process message',
        reply: 'Sorry, there was an error processing your message. Reply HELP for assistance.',
      };
    }
  }

  // Parse incoming message to determine intent
  private static parseIncomingMessage(phoneNumber: string, messageBody: string): SMSResponse {
    const cleanMessage = messageBody.trim().toUpperCase();
    const words = cleanMessage.split(' ');
    const firstWord = words[0];

    // Check for commands
    if (firstWord === 'JOIN' && words.length >= 2) {
      return {
        phoneNumber,
        messageContent: messageBody,
        receivedAt: new Date(),
        sessionId: words[1],
        isJoinCommand: true,
        isResponseCommand: false,
        commandType: 'JOIN',
      };
    }

    if (['LEAVE', 'EXIT', 'QUIT'].includes(firstWord)) {
      return {
        phoneNumber,
        messageContent: messageBody,
        receivedAt: new Date(),
        isJoinCommand: false,
        isResponseCommand: false,
        commandType: 'LEAVE',
      };
    }

    if (['HELP', '?'].includes(firstWord)) {
      return {
        phoneNumber,
        messageContent: messageBody,
        receivedAt: new Date(),
        isJoinCommand: false,
        isResponseCommand: false,
        commandType: 'HELP',
      };
    }

    if (['STOP', 'UNSUBSCRIBE', 'CANCEL'].includes(firstWord)) {
      return {
        phoneNumber,
        messageContent: messageBody,
        receivedAt: new Date(),
        isJoinCommand: false,
        isResponseCommand: false,
        commandType: 'STOP',
      };
    }

    // If user is in an active session, treat as response
    const activeSession = this.activeSessions.get(phoneNumber);
    if (activeSession && activeSession.isActive) {
      return {
        phoneNumber,
        messageContent: messageBody,
        receivedAt: new Date(),
        sessionId: activeSession.sessionId,
        isJoinCommand: false,
        isResponseCommand: true,
      };
    }

    // Unknown command
    return {
      phoneNumber,
      messageContent: messageBody,
      receivedAt: new Date(),
      isJoinCommand: false,
      isResponseCommand: false,
    };
  }

  // Handle JOIN command
  private static async handleJoinCommand(
    smsResponse: SMSResponse,
    profileId: string
  ): Promise<{ success: boolean; reply: string }> {
    const sessionId = smsResponse.sessionId!;

    // Verify session exists and allows SMS
    const session = await db
      .select()
      .from(pollSessions)
      .where(eq(pollSessions.id, sessionId))
      .limit(1);

    if (session.length === 0) {
      return {
        success: false,
        reply: `Session ${sessionId} not found. Please check the session ID and try again.`,
      };
    }

    if (!session[0].allowSms || !session[0].isActive) {
      return {
        success: false,
        reply: 'This session does not allow SMS participation or has ended.',
      };
    }

    // Join the session
    const smsSession: SMSSession = {
      phoneNumber: smsResponse.phoneNumber,
      sessionId,
      joinedAt: new Date(),
      responseCount: 0,
      isActive: true,
    };

    this.activeSessions.set(smsResponse.phoneNumber, smsSession);

    // Add automatic tag
    await ProfileService.addProfileTag(
      profileId,
      'sms_participant',
      'auto_behavior',
      sessionId,
      'system'
    );

    return {
      success: true,
      reply: `✅ You've joined "${session[0].title}"!\n\n📝 Question: ${session[0].question}\n\nReply with your response. Send LEAVE to exit or HELP for more options.`,
    };
  }

  // Handle LEAVE command
  private static async handleLeaveCommand(
    smsResponse: SMSResponse
  ): Promise<{ success: boolean; reply: string }> {
    const activeSession = this.activeSessions.get(smsResponse.phoneNumber);

    if (!activeSession || !activeSession.isActive) {
      return {
        success: false,
        reply: "You're not currently in any session. Send JOIN <session-id> to join a poll.",
      };
    }

    // Mark session as inactive
    activeSession.isActive = false;
    activeSession.leftAt = new Date();
    this.activeSessions.set(smsResponse.phoneNumber, activeSession);

    return {
      success: true,
      reply: '👋 You have left the session. Thanks for participating! Send JOIN <session-id> to join another poll.',
    };
  }

  // Handle HELP command
  private static async handleHelpCommand(): Promise<{ success: boolean; reply: string }> {
    return {
      success: true,
      reply: `📱 Word Bubbler SMS Commands:

JOIN <session-id> - Join a poll session
LEAVE - Leave current session
HELP - Show this help message
STOP - Unsubscribe from all messages

When in a session, simply text your response to contribute to the word cloud!`,
    };
  }

  // Handle STOP command
  private static async handleStopCommand(
    smsResponse: SMSResponse
  ): Promise<{ success: boolean; reply: string }> {
    // Mark profile as blocked
    const profile = await ProfileService.getOrCreateProfile(smsResponse.phoneNumber);
    await db
      .update(respondentProfiles)
      .set({ isBlocked: true, updatedAt: new Date() })
      .where(eq(respondentProfiles.id, profile.id));

    // Remove from active sessions
    this.activeSessions.delete(smsResponse.phoneNumber);

    return {
      success: true,
      reply: '🛑 You have been unsubscribed from Word Bubbler SMS. You will not receive any more messages.',
    };
  }

  // Handle response submission
  private static async handleResponseSubmission(
    smsResponse: SMSResponse,
    profileId: string
  ): Promise<{ success: boolean; reply: string }> {
    const sessionId = smsResponse.sessionId!;
    const responseText = smsResponse.messageContent.trim();

    if (responseText.length === 0) {
      return {
        success: false,
        reply: 'Please send a non-empty response to contribute to the poll.',
      };
    }

    try {
      // Import rate limit service
      const { RateLimitService } = await import('./rateLimitService');

      // Check rate limits before processing
      const rateLimitResult = await RateLimitService.checkRateLimit(
        profileId,
        smsResponse.phoneNumber,
        sessionId,
        responseText,
        'sms'
      );

      if (!rateLimitResult.allowed) {
        let replyMessage = `🚫 ${rateLimitResult.reason}`;

        if (rateLimitResult.waitTime) {
          const waitMinutes = Math.ceil(rateLimitResult.waitTime / 60);
          replyMessage += ` Please wait ${waitMinutes} minute(s) before trying again.`;
        }

        return {
          success: false,
          reply: replyMessage,
        };
      }

      // Create response record
      await db.insert(responses).values({
        sessionId,
        profileId,
        textContent: responseText,
        originalText: responseText,
        wordCount: responseText.split(' ').length,
        characterCount: responseText.length,
        submissionMethod: 'sms',
        isProcessed: false,
      });

      // Update profile metrics
      await ProfileService.updateProfileMetrics(profileId, responseText);

      // Update SMS session
      const activeSession = this.activeSessions.get(smsResponse.phoneNumber);
      if (activeSession) {
        activeSession.responseCount++;
        this.activeSessions.set(smsResponse.phoneNumber, activeSession);
      }

      // Add rate limiting success tag
      await ProfileService.addProfileTag(
        profileId,
        'sms_active_contributor',
        'auto_behavior',
        `session_${sessionId}`,
        'system'
      );

      // TODO: Trigger real-time processing and WebSocket updates
      // TODO: Process sentiment analysis if enabled
      // TODO: Update word cloud data

      return {
        success: true,
        reply: '✅ Response recorded! Your contribution has been added to the word cloud. Send another response or LEAVE to exit.',
      };
    } catch (error) {
      console.error('Error saving SMS response:', error);
      return {
        success: false,
        reply: 'Sorry, there was an error saving your response. Please try again.',
      };
    }
  }

  // Handle unknown command
  private static async handleUnknownCommand(): Promise<{ success: boolean; reply: string }> {
    return {
      success: false,
      reply: "I didn't understand that command. Send HELP for available commands or JOIN <session-id> to join a poll.",
    };
  }

  // Send SMS message
  static async sendSMS(
    phoneNumber: string,
    message: string,
    fromNumber?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      const from = fromNumber || process.env.TWILIO_PHONE_NUMBER;
      if (!from) {
        return { success: false, error: 'No Twilio phone number configured' };
      }

      const messageResponse = await this.client.messages.create({
        body: message,
        from,
        to: phoneNumber,
      });

      return {
        success: true,
        messageId: messageResponse.sid,
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Send session invite via SMS
  static async sendSessionInvite(
    phoneNumbers: string[],
    sessionId: string,
    sessionTitle: string,
    customMessage?: string
  ): Promise<{ success: boolean; results: Array<{ phoneNumber: string; success: boolean; error?: string }> }> {
    const defaultMessage = `📊 You're invited to participate in "${sessionTitle}"!\n\nText: JOIN ${sessionId}\n\nPowered by Word Bubbler`;
    const message = customMessage || defaultMessage;

    const results = [];
    let overallSuccess = true;

    for (const phoneNumber of phoneNumbers) {
      const result = await this.sendSMS(phoneNumber, message);
      results.push({
        phoneNumber,
        success: result.success,
        error: result.error,
      });

      if (!result.success) {
        overallSuccess = false;
      }
    }

    return { success: overallSuccess, results };
  }

  // Get active SMS sessions
  static getActiveSessions(): Map<string, SMSSession> {
    return new Map(this.activeSessions);
  }

  // Get session stats
  static getSessionStats(sessionId: string): {
    totalParticipants: number;
    activeParticipants: number;
    totalResponses: number;
  } {
    const sessions = Array.from(this.activeSessions.values()).filter(s => s.sessionId === sessionId);

    return {
      totalParticipants: sessions.length,
      activeParticipants: sessions.filter(s => s.isActive).length,
      totalResponses: sessions.reduce((sum, s) => sum + s.responseCount, 0),
    };
  }

  // Validate phone number format
  static validatePhoneNumber(phoneNumber: string): { valid: boolean; formatted?: string; error?: string } {
    // Basic E.164 format validation
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.length < 10 || cleaned.length > 15) {
      return { valid: false, error: 'Invalid phone number length' };
    }

    // Add country code if missing (assume US +1)
    const formatted = cleaned.startsWith('1') ? `+${cleaned}` : `+1${cleaned}`;

    return { valid: true, formatted };
  }
}

// Initialize SMS service on module load
SMSService.initialize();