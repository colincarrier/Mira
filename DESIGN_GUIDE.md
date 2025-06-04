# Mira Design Guide

## Component Architecture

### Separation of Concerns
- **FloatingInputBar**: Handles all input functionality (text, voice, camera capture)
- **BottomNavigation**: Only handles tab navigation (Notes, To-Dos, Collections, Settings)
- **UniversalInputBar**: Core input component with voice recording and camera capture

### Input Bar Button Colors

#### Button Color Specifications
- **Plus Button**: `bg-gray-300` (Light Grey) - Used for adding new content/media uploads
- **Camera Button**: `#a8bfa1` (Muted Green) - Used for photo capture
- **Mic Button**: `#9bb8d3` (Soft Blue) - Used for voice recording (turns red `#ef4444` when recording)
- **Send Button**: `bg-blue-500` (Blue) - Used when typing to send messages

#### Button States
- **Default State**: Shows Plus + Camera + Mic buttons
- **Typing State**: Shows Plus + Send buttons (Camera and Mic hidden)
- **Recording State**: Mic button turns red with square stop icon

## Voice Recording System

### Inline Voice Recording
- **Implementation**: Waveform overlay appears on top of white input bar during recording
- **Visual Design**: Red streaming waveform bars with recording timer
- **Button Behavior**: Blue mic button turns red during recording with stop icon
- **Processing**: Auto-saves audio file and AI transcript when recording stops
- **User Experience**: Input bar remains visible with semi-transparent overlay

### Recording States
1. **Idle**: Blue mic button (`#9bb8d3`)
2. **Recording**: Red mic button (`#ef4444`) with square stop icon
3. **Processing**: Shows "Processing..." indicator
4. **Complete**: Returns to idle state, creates new note

## Camera Capture System

### Full-Screen Camera Mode
- **Activation**: Click green camera button (`#a8bfa1`) in input bar
- **Interface**: Full-screen camera preview with overlay controls
- **Capture Button**: Hollow white ring positioned above input bar
  - **Design**: Transparent center with 50% transparent white border (`border-white/50`)
  - **Position**: 4px gap above input bar
  - **Hover State**: Increases opacity (`border-white/70`)

### Navigation Integration
- **Auto-Close**: Camera preview closes automatically when navigation tabs are clicked
- **Seamless Transition**: Immediately navigates to selected tab after closing camera

## Positioning & Layout

### Input Bar Positioning
- **Location**: Fixed position at `calc(6rem + 2px)` from bottom
- **Spacing**: 2px above the 6rem navigation bar height
- **Shadow**: Drop shadow (`shadow-lg`) with improved border (`border-gray-300`)
- **Z-Index**: 9999 for proper layering

### Capture Button Positioning
- **Location**: `calc(6rem + 2px + 80px + 4px)` from bottom
- **Calculation**: Navigation height + input bar offset + input bar height + 4px gap
- **Z-Index**: 10001 to appear above input bar

### Text Styling
- **Font Size**: `text-sm` for consistent appearance
- **Placeholder**: `placeholder-gray-500` for proper contrast
- **Text Color**: `text-gray-900` for readability
- **Alignment**: `items-center` for proper vertical alignment with buttons

## Universal Component Guidelines
- Use UniversalInputBar component to maintain consistency
- FloatingInputBar wraps UniversalInputBar for positioning
- All input bars maintain same styling and functionality
- Voice recording works inline without modal overlays

## Button Layout Order (left to right)
1. **Text Field**: Expandable textarea with auto-resize
2. **Plus Button**: Media upload (`bg-gray-300`)
3. **Camera Button**: Photo capture (`#a8bfa1`) - hidden when typing
4. **Mic Button**: Voice recording (`#9bb8d3`/`#ef4444`) - hidden when typing
5. **Send Button**: Text submission (`bg-blue-500`) - only shown when typing

## Text Properties
- **Plus Button**: White text (`text-white`)
- **Camera Button**: Gray text (`text-gray-700`)
- **Mic Button**: Gray text (`text-gray-700`) / White when recording
- **Send Button**: White text (`text-white`)