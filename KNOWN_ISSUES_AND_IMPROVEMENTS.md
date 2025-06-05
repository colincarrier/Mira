# Known Issues and Improvements Tracker

## Active Bugs

### Voice Recording Issues
**Priority: High**
- **Issue 1**: Voice recordings shorter than 1 second still create placeholder notes and get processed
- **Current Status**: Duration check exists but placeholder note creation happens before duration validation
- **Expected Behavior**: Recordings under 1 second should not create any notes or placeholders
- **Debug Notes**: Console logging shows correct duration measurement, but mutation still triggers
- **Technical Details**: The issue is in the async flow - placeholder note is created immediately in mutation, before duration check

- **Issue 2**: Recording timer runs at incorrect speed (too fast)
- **Current Status**: Timer appears to tick faster than 1-second intervals
- **Expected Behavior**: Timer should increment exactly every 1 second
- **Debug Notes**: Added console logging to track timer increments

### Voice Note Duration Display
**Priority: Medium**
- **Issue**: All voice notes display as "0:45" duration with halfway progress bar regardless of actual recording length
- **Current Status**: Display bug in note card component
- **Expected Behavior**: Should show actual recording duration and accurate progress indicator
- **Impact**: Users cannot see actual voice note lengths in the interface

## UI/UX Improvements

### Waveform Visualization
**Priority: Medium**
- **Status**: Recently improved positioning and styling
- **Remaining Issues**: 
  - Waveform data sometimes doesn't populate during recording
  - Animation could be smoother
  - Need better fallback when audio context fails

### Input Bar Mutual Exclusion
**Priority: High**
- **Status**: Implemented but needs verification
- **Issue**: Three modes (submenu, camera, voice) should be mutually exclusive
- **Current Behavior**: Unclear if modes properly close each other when activated

## Performance Issues

### Express Rate Limiting Warnings
**Priority: Low**
- **Issue**: ValidationError logs about X-Forwarded-For header and trust proxy settings
- **Impact**: Cosmetic - doesn't affect functionality but clutters logs
- **Solution**: Configure Express trust proxy setting

## Feature Enhancements

### Sync Status Indicator
**Priority: Medium**
- **Status**: Implemented red badge on settings tab
- **Improvements Needed**:
  - Better visual feedback for sync conflicts
  - More granular sync status information
  - Automatic retry mechanism visualization

### Toast Notifications
**Priority: Low**
- **Status**: Recently updated to auto-dismiss after 3 seconds
- **Potential Improvements**:
  - Different durations based on message importance
  - Queue management for multiple toasts
  - Better error state handling

## Architecture Considerations

### Database Schema
**Priority: Medium**
- **Current**: Using Drizzle ORM with PostgreSQL
- **Considerations**: 
  - Mode field requirements causing database errors
  - Better default value handling
  - Improved validation at schema level

### Offline-First Architecture
**Priority: High**
- **Status**: Implemented with IndexedDB and service workers
- **Monitoring Needed**:
  - Sync conflict resolution effectiveness
  - Data consistency across online/offline transitions
  - Performance impact of dual storage system

## Testing Requirements

### Voice Recording Flow
- [ ] Test duration measurement accuracy
- [ ] Verify placeholder note creation timing
- [ ] Test different audio formats and browser compatibility
- [ ] Validate minimum duration enforcement

### Mutual Exclusion Testing
- [ ] Verify submenu closes when camera is opened
- [ ] Verify camera mode closes when voice recording starts
- [ ] Verify voice recording stops when submenu is opened
- [ ] Test rapid mode switching behavior

### Sync Status Testing
- [ ] Test offline change accumulation
- [ ] Verify red badge count accuracy
- [ ] Test sync completion and badge clearing
- [ ] Validate conflict detection and resolution

## Documentation Needs

### User-Facing Documentation
- [ ] Voice recording best practices
- [ ] Offline mode usage guide
- [ ] Sync conflict resolution steps

### Developer Documentation
- [ ] Input bar architecture explanation
- [ ] Sync service implementation details
- [ ] Audio processing pipeline documentation

---

**Last Updated**: June 5, 2025
**Next Review**: When addressing voice recording issues