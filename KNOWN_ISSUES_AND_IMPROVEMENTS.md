# Mira - Known Issues and Future Improvements

## External Content Integration System (New - High Priority)

### Phase 1: Email Integration
- [ ] Setup SendGrid inbound parsing webhook
- [ ] Create `/api/email-webhook` endpoint for processing
- [ ] Implement email subject line parsing for collections/tags
- [ ] Build user identification via sender email
- [ ] Create confirmation email templates
- [ ] Support forwarded content separation from user notes
- [ ] Handle attachments (images, PDFs, documents)

### Phase 2: iOS Share Sheet Integration  
- [ ] Update PWA manifest.json with share_target configuration
- [ ] Create `/share-capture` page with custom interface
- [ ] Build content preview and user annotation system
- [ ] Add collection selector and tagging interface
- [ ] Implement reminder toggle for shared content
- [ ] Support text, URLs, images, and PDFs from any iOS app

### Phase 3: SMS Integration
- [ ] Setup Twilio account and dedicated phone number
- [ ] Create SMS webhook handler for incoming messages
- [ ] Implement phone number verification system
- [ ] Build message parsing for commands (#work, !remind, @tags)
- [ ] Add MMS support for images and voice messages
- [ ] Create conversation threading for multi-part content

### Technical Architecture:
- **Single SMS Number**: One Twilio number handles all users via phone number identification
- **Email Parsing**: Smart separation of user notes vs forwarded content
- **Share Sheet UX**: Custom interface with preview, notes, collections, and reminder options
- **Cross-Platform**: All methods create consistent notes through existing AI pipeline

## Sophisticated Push Notifications System (Future Development)

### Core Features to Build:
- **Cross-platform push notifications** (Web Push API, mobile app notifications)
- **Intelligent notification timing** based on user behavior patterns and preferences
- **Smart notification bundling** to avoid notification fatigue
- **Location-based reminders** using geofencing
- **Contextual notifications** that adapt based on user's current activity
- **Notification analytics** to optimize delivery timing and effectiveness

### Technical Implementation:
- Service worker integration for web push notifications
- Push notification server infrastructure
- User notification preferences management
- Notification scheduling and queuing system
- Cross-device synchronization of notification states
- Fallback mechanisms (email, SMS) for critical reminders

### Advanced Features:
- **Predictive notifications** using AI to suggest optimal reminder times
- **Natural language processing** for notification content optimization
- **Biometric integration** for stress-aware notification timing
- **Calendar integration** for context-aware scheduling
- **Team/family notification coordination** for shared reminders
- **Voice-activated notification responses**

## Enhanced Reminder/Todo Classification System (In Progress)

### Recently Implemented:
- ✅ Enhanced database schema with time-sensitivity fields
- ✅ Sophisticated notification structure in todos table
- ✅ Time dependency tracking and task relationships
- ✅ Updated AI prompt template for temporal analysis

### Next Steps:
- Update frontend to display Reminders section with filters (today, week, month, year)
- Implement reminder vs todo separation in UI
- Add time-based filtering and sorting
- Create notification scheduling logic
- Build recurring reminder patterns

## AI Analysis Enhancement (Recently Completed)

### Completed Features:
- ✅ Restored sophisticated AI analysis with 17+ analysis fields
- ✅ Enhanced prompt template with comprehensive structure
- ✅ Identical prompts for OpenAI and Claude (like-for-like testing)
- ✅ Rich context generation and predictive intelligence
- ✅ Task hierarchy analysis and knowledge connections

## UI/UX Improvements (Ongoing)

### Camera and Microphone Integration:
- ✅ Camera button (#a8bfa1 muted green)
- ✅ Mic button (#9bb8d3 soft blue)
- ✅ Subtle AI processing indicator (bouncing ball)

### Collections Organization:
- ✅ Collections order: To-dos (top-left), Personal (top-right), Home (bottom-left), Work (bottom-right)
- ✅ Individual line items display as todo-style clickable rows
- ❌ Collection super note pages still not working consistently (routing/loading issues)

## Database and Performance Optimizations

### Future Enhancements:
- **Indexing optimization** for time-based queries on reminders
- **Archive and cleanup systems** for old completed todos
- **Bulk operations** for managing large numbers of reminders
- **Database partitioning** for improved performance at scale
- **Caching strategies** for frequently accessed reminder data

## Security and Privacy Features

### Planned Implementations:
- **End-to-end encryption** for sensitive reminders and todos
- **Granular privacy controls** for shared reminders
- **Audit logging** for notification and reminder activities
- **Data retention policies** with automatic cleanup
- **GDPR compliance** features for data export and deletion

### ChatGPT Storage Integration Security (Backlog)
- **Comprehensive Security Audit** of storage endpoints and authentication
- **Enhanced API Authentication** with token-based access controls
- **User session management** and secure cookie handling
- **Rate limiting and abuse prevention** for storage operations
- **Encryption at rest** for stored files in Replit Object Storage
- **Access logging and monitoring** for all storage operations
- **Secure file sharing** with expirable URLs and permissions

### Legal and Confidential Conversations (Backlog)
- **Privileged Communication Mode** for attorney-client privileged content
- **Legal Service Integration** with verified law firms and attorneys
- **Enhanced Encryption** for confidential legal conversations
- **Audit-proof logging** with legal compliance standards
- **Document privilege marking** and automatic classification
- **Legal hold capabilities** for litigation support
- **Attorney verification system** and secure communication channels
- **Confidentiality warnings** and user consent workflows

## Integration Opportunities

### External Services:
- **Calendar applications** (Google Calendar, Outlook, Apple Calendar)
- **Task management tools** (Todoist, Asana, Trello)
- **Communication platforms** (Slack, Teams, Discord)
- **Voice assistants** (Siri, Google Assistant, Alexa)
- **Wearable devices** for contextual reminders
- **Smart home integration** for location-based notifications

## Performance and Scalability

### Monitoring and Metrics:
- Notification delivery success rates
- User engagement with different reminder types
- AI analysis accuracy and user satisfaction
- Database query performance optimization
- Real-time sync performance across devices

## Accessibility and Internationalization

### Future Features:
- **Screen reader optimization** for visually impaired users
- **Voice-only interaction modes** for hands-free operation
- **Multi-language support** for global user base
- **Timezone-aware notifications** for international users
- **Cultural sensitivity** in notification timing and content

# Known Issues and Improvements

## Current Issues

### High Priority
- [ ] **Git lock file issue**: Persistent `.git/index.lock` files preventing commits during development. Occurs when git operations are interrupted or run concurrently. Workaround: `rm -f .git/index.lock` before git operations.
- [ ] Collections dropdown not showing proper collection names in some cases
- [ ] Voice recording permissions need better UX flow
- [ ] PWA install prompt could be more prominent

### Medium Priority
- [ ] Offline sync occasionally shows stale data
- [ ] Image compression could be more aggressive for mobile
- [ ] Search functionality needs performance optimization

### Low Priority
- [ ] Dark mode toggle animation could be smoother
- [ ] Loading states could be more consistent
- [ ] Error messages could be more user-friendly

---

*This document serves as our internal roadmap and feature tracking system. Items marked with ✅ are completed, items without marks are planned for future development.*