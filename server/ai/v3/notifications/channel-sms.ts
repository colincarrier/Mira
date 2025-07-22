import { NotificationPayload } from './types.js';
import { getPhone } from './user-profiles.js';

export async function sendSMS(userId: string, payload: NotificationPayload): Promise<void> {
  const { TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM } = process.env;
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) throw new Error('Twilio not configured');

  const phone = await getPhone(userId);
  if (!phone) throw new Error(`No phone number for user ${userId}`);

  const twilio = (await import('twilio')).default(TWILIO_SID, TWILIO_TOKEN);
  await twilio.messages.create({
    from: TWILIO_FROM,
    to: phone,
    body: `${payload.title}: ${payload.body}`
  });
}