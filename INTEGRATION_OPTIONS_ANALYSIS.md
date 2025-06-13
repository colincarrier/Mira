# Mira Integration Options Analysis

## 1. iOS Native Share Sheet Integration

### Technical Overview
Since Mira is a PWA (Progressive Web App), we can implement iOS share sheet integration through several approaches:

**Option A: Web Share API (Recommended)**
- Use `navigator.share()` for outgoing shares
- Register as share target using Web Share Target API
- Requires HTTPS and service worker registration

**Option B: Custom URL Scheme**
- Register `mira://` custom URL scheme
- Handle incoming shares via URL parameters
- Works with iOS shortcuts and other apps

**Option C: iOS Shortcuts Integration**
- Create iOS Shortcuts that POST to Mira's API
- Users can add "Share to Mira" shortcut
- Most flexible for power users

### Implementation Plan
```javascript
// 1. Register as Web Share Target
// In manifest.json:
{
  "share_target": {
    "action": "/share-handler",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [{
        "name": "files",
        "accept": ["image/*", "text/*"]
      }]
    }
  }
}

// 2. Handle incoming shares
// In service worker:
self.addEventListener('fetch', event => {
  if (event.request.url.includes('/share-handler')) {
    event.respondWith(handleShare(event.request));
  }
});
```

**Benefits:**
- Native iOS integration
- Handles text, URLs, and files
- Works from any iOS app
- No additional app installation

**Limitations:**
- Requires PWA installation
- iOS 14+ for full support
- Limited customization options

## 2. Phone Number/SMS Integration

### Technical Overview
**Option A: Twilio SMS Webhook**
- Phone number: Get dedicated number via Twilio
- Incoming SMS triggers webhook to Mira API
- Parse message content and create note automatically

**Option B: Email-to-SMS Gateway**
- Use carrier SMS gateways (e.g., number@vtext.com)
- Monitor dedicated email inbox
- Convert SMS-to-email back to notes

### Implementation Plan
```javascript
// Twilio webhook handler
app.post('/api/sms-webhook', async (req, res) => {
  const { From, Body, MediaUrl0 } = req.body;
  
  // Create note from SMS
  const note = await createNote({
    content: Body,
    mode: MediaUrl0 ? 'image' : 'text',
    mediaUrl: MediaUrl0,
    source: 'sms',
    phoneNumber: From
  });
  
  // Optional: Send confirmation SMS
  await twilioClient.messages.create({
    body: `✓ Added to Mira: "${Body.substring(0, 50)}..."`,
    to: From,
    from: MIRA_PHONE_NUMBER
  });
});
```

**Required Setup:**
- Twilio account and phone number (~$1/month)
- Webhook endpoint configuration
- User phone number verification system
- Rate limiting and spam protection

**Benefits:**
- Universal accessibility (any phone)
- No app required
- Works offline for sender
- Can include media attachments

**Challenges:**
- Monthly cost for phone number
- SMS character limits
- Spam management
- User verification needed

## 3. Email Integration

### Technical Overview
**Option A: Dedicated Email Address**
- Setup: notes@mira.app or user-specific addresses
- Parse incoming emails and create notes
- Support for attachments and rich content

**Option B: Email Forwarding Rules**
- Users forward emails to Mira address
- Preserve original sender/subject context
- Handle email threads and replies

### Implementation Plan
```javascript
// Email processing service
async function processIncomingEmail(emailData) {
  const { from, subject, text, html, attachments } = emailData;
  
  // Extract user from email address or subject line
  const user = await identifyUser(from, subject);
  
  // Create note with email content
  const note = await createNote({
    content: text || stripHtml(html),
    mode: 'email',
    source: 'email',
    metadata: {
      from,
      subject,
      originalHtml: html,
      attachments: attachments?.map(a => a.filename)
    }
  });
  
  // Process any attachments
  if (attachments?.length) {
    await processEmailAttachments(note.id, attachments);
  }
}
```

**Service Options:**
- **SendGrid Inbound Parse** (Free tier: 100 emails/day)
- **Mailgun** ($0.50/1000 emails)
- **AWS SES** (~$0.10/1000 emails)

**Benefits:**
- Rich content support (HTML, attachments)
- No character limits
- Familiar interface for users
- Can preserve email context

**Challenges:**
- Spam filtering required
- User authentication needed
- Attachment storage costs
- Email parsing complexity

## Recommended Implementation Priority

### Phase 1: Email Integration (Immediate)
**Why First:**
- Lowest technical barrier
- No ongoing SMS costs
- Rich content support
- Universal accessibility

**Quick Setup:**
1. Register domain email address
2. Configure SendGrid inbound parsing
3. Create `/api/email-webhook` endpoint
4. Add user email verification system

### Phase 2: iOS Share Sheet (Medium Term)
**Why Second:**
- Enhances mobile experience
- Leverages existing PWA infrastructure
- Native iOS integration

**Implementation Steps:**
1. Update PWA manifest with share target
2. Create share handler service worker
3. Add share processing endpoint
4. Test across iOS Safari and Chrome

### Phase 3: SMS Integration (Advanced)
**Why Last:**
- Ongoing costs required
- More complex spam management
- Verification system needed

**Implementation Steps:**
1. Setup Twilio account and number
2. Create SMS webhook handler
3. Implement user phone verification
4. Add rate limiting and spam protection

## User Experience Flow

### Email to Mira:
1. User forwards email to `capture@mira.app`
2. System identifies user by email address
3. Creates note with subject + body content
4. Sends confirmation email with note link

### iOS Share Sheet:
1. User selects "Share" in any iOS app
2. Chooses "Mira" from share options
3. Content automatically saved as note
4. Notification confirms successful capture

### SMS to Mira:
1. User texts to Mira phone number
2. System creates note from message content
3. Replies with confirmation text
4. Supports images via MMS

## Security Considerations

- **Email**: Verify sender domains, implement rate limiting
- **SMS**: Phone number verification, spam detection
- **Share Sheet**: Origin validation, content sanitization
- **All Methods**: User authentication, content moderation

## Cost Analysis

- **Email**: $0-50/month (depending on volume)
- **SMS**: $1-15/month (number + usage)
- **Share Sheet**: $0 (leverages existing infrastructure)

This multi-channel approach would make Mira extremely accessible for quick content capture from any device or platform.