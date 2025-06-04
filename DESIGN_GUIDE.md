# Mira Design Guide

## Input Bar Button Colors

### Button Color Specifications
- **Plus Button**: `bg-gray-300` (Light Grey) - Used for adding new content/media uploads
- **Camera Button**: `bg-green-300` (Light Green) - Used for photo capture
- **Mic Button**: `bg-blue-300` (Light Blue) - Used for voice recording
- **Send Button**: `bg-blue-500` (Blue) - Used when typing to send messages

### Button States
- **Default State**: Shows Plus + Camera + Mic buttons
- **Typing State**: Shows Plus + Send buttons (Camera and Mic collapse)

### Other UI Elements
- **More Options Button Background**: `#f9fafb` (Light Gray) - Used in note card headers
- **Input Bar Corner Radius**: `rounded-2xl` (16px) - Fixed radius that maintains shape when textarea expands
- **Button Spacing**: `gap-1.5` (6px) - 50% reduced from original spacing

### Button Layout Order (left to right)
1. Text Field (expandable textarea)
2. Plus Button (green)
3. Camera Button (light blue) - hidden when typing
4. Mic Button (blue) - hidden when typing
5. Send Button (blue) - only shown when typing

### Text Properties
- Plus Button: White text (`text-white`)
- Camera Button: Gray text (`text-gray-700`)
- Mic Button: Gray text (`text-gray-700`)
- Send Button: White text (`text-white`)