// Twilio SMS Webhook API endpoint for processing incoming messages

import { NextApiRequest, NextApiResponse } from 'next';
import { SMSService } from '../../../src/services/smsService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract Twilio data from webhook
    const {
      From: phoneNumber,
      Body: messageBody,
      MessageSid: messageSid,
      AccountSid: accountSid,
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !messageBody) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Optional: Validate webhook authenticity
    // const twilioSignature = req.headers['x-twilio-signature'] as string;
    // if (!validateTwilioSignature(twilioSignature, req.body)) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    console.log(`Incoming SMS from ${phoneNumber}: ${messageBody}`);

    // Process the message
    const result = await SMSService.processIncomingSMS(phoneNumber, messageBody, {
      messageSid,
      accountSid,
    });

    // Send reply if needed
    if (result.reply) {
      const smsResult = await SMSService.sendSMS(phoneNumber, result.reply);
      if (!smsResult.success) {
        console.error('Failed to send SMS reply:', smsResult.error);
      }
    }

    // Respond to Twilio with TwiML (empty response to not send additional messages)
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error) {
    console.error('SMS webhook error:', error);

    // Send error response but don't expose internal errors
    res.setHeader('Content-Type', 'text/xml');
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
}

// Optional: Validate Twilio webhook signature for security
function validateTwilioSignature(signature: string, body: any): boolean {
  // Implement Twilio signature validation if needed
  // https://www.twilio.com/docs/usage/webhooks/webhooks-security
  return true; // Simplified for MVP
}