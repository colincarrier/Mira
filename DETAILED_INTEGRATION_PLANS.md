# Detailed Integration Plans for Mira

## 1. iOS Native Share Sheet Integration

### User Experience Flow
```
User in Safari/Photos/Notes app → Tap Share → Select "Mira" → Custom Share Interface → Content Saved
```

### Custom Share Interface Design
When user selects "Mira" from iOS share sheet, they see:

```
┌─────────────────────────────────┐
│  📝 Add to Mira                │
├─────────────────────────────────┤
│                                 │
│  [Original Content Preview]    │
│  "Check out this article..."    │
│                                 │
├─────────────────────────────────┤
│  💭 Add your notes:            │
│  ┌─────────────────────────────┐ │
│  │ Why I'm saving this...      │ │
│  │                             │ │
│  │                             │ │
│  └─────────────────────────────┘ │
├─────────────────────────────────┤
│  🏷️ Tags (optional):           │
│  [work] [research] [+]          │
├─────────────────────────────────┤
│  📁 Collection:                │
│  [Personal ▼] [Work] [Research] │
├─────────────────────────────────┤
│  🔔 Create reminder?           │
│  [ ] Set reminder for this      │
├─────────────────────────────────┤
│         [Cancel] [Save to Mira] │
└─────────────────────────────────┘
```

### Technical Implementation Details

**Manifest.json Updates:**
```json
{
  "share_target": {
    "action": "/share-capture",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text", 
      "url": "url",
      "files": [{
        "name": "files",
        "accept": ["image/*", "text/*", "application/pdf"]
      }]
    }
  }
}
```

**Share Handler Page (/share-capture):**
```javascript
// Pre-populate form with shared content
const urlParams = new URLSearchParams(window.location.search);
const sharedTitle = urlParams.get('title');
const sharedText = urlParams.get('text');
const sharedUrl = urlParams.get('url');

// Display custom interface with:
// 1. Content preview
// 2. User notes input
// 3. Collection selector
// 4. Tags input
// 5. Reminder toggle
```

**Content Processing:**
- Text: Direct capture with user notes
- URLs: Fetch metadata, create rich preview
- Images: OCR processing + user annotations
- PDFs: Text extraction + thumbnail

### Customization Options
1. **Quick Actions Bar**: [Save for Later] [Need to Research] [Share with Team]
2. **Smart Suggestions**: Based on content type and user history
3. **Voice Notes**: Record audio annotation alongside shared content
4. **Location Context**: Auto-tag with current location if relevant

## 2. Email Integration Detailed Plan

### Email Address Structure
```
Primary: capture@mira.app
User-specific: username+capture@mira.app
Collection-specific: work+capture@mira.app
```

### Email Parsing Method

**Incoming Email Structure:**
```
Subject: [Optional: Collection/Tags] Original Subject
Body: 
User notes/context (optional)
---
[Original forwarded content]
```

**Parsing Logic:**
```javascript
function parseIncomingEmail(email) {
  const { from, subject, text, html, attachments } = email;
  
  // 1. Extract user intent from subject
  const parsed = parseSubject(subject);
  // "[work,urgent] Meeting notes" → collection: work, tags: urgent
  
  // 2. Separate user notes from forwarded content
  const content = separateUserNotes(text);
  /*
  "This is important for the project
  ---
  [Forwarded message begins...]"
  */
  
  // 3. Identify content type
  const contentType = detectContentType(content, attachments);
  
  // 4. Create structured note
  return {
    userNotes: content.userNotes,
    originalContent: content.forwarded,
    collection: parsed.collection,
    tags: parsed.tags,
    attachments: processAttachments(attachments)
  };
}
```

### Email Formats Supported

**1. Simple Forward:**
```
To: capture@mira.app
Subject: Interesting article about AI

This looks relevant for our project.

[Forwarded article content...]
```

**2. Structured Capture:**
```
To: capture@mira.app
Subject: [research,ai] Paper on neural networks

Need to review for next week's presentation.
Key points to focus on: architecture, performance metrics.

---
[Original paper/email content]
```

**3. Quick Capture:**
```
To: capture@mira.app
Subject: Shopping list

Milk, eggs, bread, coffee
Pick up by Friday
```

### Processing Workflow
1. **Email Received** → SendGrid webhook triggers
2. **User Identification** → Match sender email to Mira account
3. **Content Parsing** → Extract user notes vs. original content
4. **AI Enhancement** → Process with existing Mira AI pipeline
5. **Note Creation** → Save with proper attribution and metadata
6. **Confirmation** → Send receipt email with note link

### Email Templates for Responses
```
✓ Content Added to Mira

Your email "Interesting article about AI" has been saved.

📝 Note: research-ai-001
📁 Collection: Research  
🏷️ Tags: ai, research
🔗 View in Mira: https://mira.app/notes/abc123

Reply to this email to add more context.
```

## 3. SMS Integration - Single Number Architecture

### Multi-User Single Number System

**Phone Number Architecture:**
- **One Twilio Number**: +1-555-MIRA-123
- **User Identification**: Incoming phone number → Mira account lookup
- **Content Processing**: Same SMS number handles all users

**User Registration Flow:**
```
1. User adds phone number in Mira profile
2. System sends verification code
3. User confirms number ownership
4. Phone number linked to Mira account
```

### SMS Content Parsing

**Message Structure Recognition:**
```javascript
function parseSMSContent(messageBody, fromNumber) {
  // Pattern 1: Simple note
  "Pick up groceries tomorrow"
  
  // Pattern 2: With collection
  "#work Meeting with client at 3pm"
  
  // Pattern 3: With reminder
  "!remind Doctor appointment 2pm Friday"
  
  // Pattern 4: With tags
  "@urgent @project Call supplier about delay"
  
  // Pattern 5: Voice-to-text
  "Hey Mira, remember that I need to..."
}
```

**Smart Parsing Logic:**
```javascript
const smsPatterns = {
  collection: /^#(\w+)\s+(.+)/, // #work content
  reminder: /^!remind\s+(.+)/, // !remind content  
  tags: /@(\w+)/g, // @tag1 @tag2
  location: /at\s+([A-Z][a-z\s]+)/, // at Starbucks
  time: /(tomorrow|today|friday|\d+:\d+|\d+pm)/gi
};
```

### SMS Response System

**Confirmation Messages:**
```
✓ Added: "Pick up groceries tomorrow"
🔗 mira.app/n/abc123

Reply with more details or "done" to finish.
```

**Command Responses:**
```
User: "show today"
Mira: "📋 Today's items:
• Meeting at 3pm
• Pick up groceries  
• Call mom
🔗 mira.app/today"

User: "remind me to call mom in 1 hour"  
Mira: "⏰ Reminder set for 6:30 PM
✓ Added to your notes"
```

### Advanced SMS Features

**1. Conversation Threading:**
```
User: "Meeting notes"
Mira: "✓ Started note. Reply to add content."
User: "Discussed Q3 budget"
Mira: "✓ Added to meeting notes"
User: "Action items: hire developer"
Mira: "✓ Added. Say 'done' when finished."
```

**2. Photo/MMS Support:**
```
User: [Sends photo of whiteboard]
Mira: "🖼️ Image received. Processing text...
✓ Found: 'Project timeline, Phase 1: Design'
Reply to add context or corrections."
```

**3. Voice Message Integration:**
```
User: [Sends voice message via MMS]
Mira: "🎤 Transcribed: 'Remember to book flight for conference next month'
✓ Saved as reminder
Set alert? Reply 'yes' or ignore."
```

### Cost Efficiency Model

**Single Number Scaling:**
- **One Number**: $1/month base cost
- **Incoming SMS**: $0.0075 per message
- **Outgoing SMS**: $0.0075 per message  
- **MMS**: $0.02 per message

**Volume Examples:**
- 1,000 users, 10 texts/month each = $150/month total
- 10,000 users, 5 texts/month each = $750/month total
- Scales linearly with usage, not user count

## Implementation Priority & Backlog Integration

### Phase 1: Email Integration (Week 1-2)
- [ ] Setup SendGrid inbound parsing
- [ ] Create email webhook endpoint
- [ ] Implement subject line parsing
- [ ] Build user identification system
- [ ] Create confirmation email templates
- [ ] Test with various email formats

### Phase 2: iOS Share Sheet (Week 3-4)  
- [ ] Update PWA manifest.json
- [ ] Create custom share capture page
- [ ] Build content type detection
- [ ] Implement preview generation
- [ ] Add collection/tag selectors
- [ ] Test across iOS apps

### Phase 3: SMS Integration (Week 5-6)
- [ ] Setup Twilio account and number
- [ ] Create SMS webhook handler
- [ ] Implement phone verification flow
- [ ] Build message parsing engine
- [ ] Add MMS/voice support
- [ ] Create command system

### Testing Strategy
- **Email**: Test with Gmail, Outlook, Apple Mail forwards
- **iOS**: Test from Safari, Photos, Notes, Messages, third-party apps
- **SMS**: Test from iPhone, Android, different carriers
- **Integration**: Verify all methods create properly formatted notes

This architecture creates a seamless content capture ecosystem where users can add to Mira from anywhere using their preferred method, with intelligent parsing and processing maintaining consistent note quality across all channels.