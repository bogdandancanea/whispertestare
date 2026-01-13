# **App Name**: Whisper

## Core Features:

- Message Encryption: Encrypt messages using AES-256-GCM for secure sending.
- Message Decryption: Decrypt received messages using the provided passphrase.
- Unique ID Generation: Generate a unique, short ID for each encrypted message.
- Self-Destructing Messages: Messages are automatically deleted from the database after being read or after a fixed time has passed (24 hours).
- NFC Card Integration: Implements NFC card to save number of 'sends' and 'reads' left. This can prevent users from overusing the free service.

## Style Guidelines:

- Primary color: Accent gold (#E8C547) for primary buttons, brand elements, and interactive components.
- Background color: Dark background (#030305) to create a sense of security and focus; card backgrounds use rgba(12, 12, 18, 0.85) for subtle elevation.
- Accent color: Light gold (#F5D86E) used in gradients and subtle highlights; orange (#ffab40) and red (#ff5252) accents for warnings and danger states.
- Font: 'Inter' sans-serif for both headings and body text; clean, modern and readable.
- Code Font: Use 'Source Code Pro' monospace font for displaying the Whisper ID.
- Use simple, consistent icons from a set like Remix Icon; icons are gold-colored for emphasis.
- Subtle animations for UI transitions to enhance user experience: pulsing glows on key elements; scaling effects on cards; smooth transitions and loading states.