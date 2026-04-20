# **App Name**: Tactile Nexus

## Core Features:

- User Authentication: Secure player login and account management using Firebase Authentication (email or anonymous).
- Real-time Game Sessions: Establish real-time, 2-player game rooms where board state and player actions are instantly synchronized using Firestore.
- Server-side Game Logic: Enforce game rules, validate player moves, manage player clocks, and determine game outcomes securely using Firebase Cloud Functions.
- Dynamic Matchmaking: Enable players to easily find and join new games via a matchmaking queue, automatically redirecting them to a game session.
- Persistent Game State: Store and synchronize all game data (board, player turns, move history, clocks, and game status) in a 'games' collection in Firestore.
- Interactive Board UI: Display a centered 8x8 board grid with rounded corners, dice-style square pieces, player information, and a move history section with a clean, mobile-first responsive layout.
- Firestore Security Rules: Implement Firestore security rules to ensure authenticated access, prevent unauthorized game manipulation, and restrict client-side board updates to only through Cloud Functions.

## Style Guidelines:

- Primary color: Deep olive green (#5F7D4D), chosen from the board's dark squares, evoking a sense of calm strategy and focus. This provides a strong visual anchor against lighter elements.
- Background color: Soft neutral grey (#F3F3F3) for a clean, minimalistic base, allowing the game elements to stand out prominently.
- Accent color: Warm beige (#E8E6D8), derived from the board's light squares, complementing the primary green while adding a subtle warmth and elegance to highlight interactive elements or informational areas.
- Player piece colors: Crisp white (#F4F4F4) for one set of pieces and a dark charcoal (#2F2F2F) for the other, ensuring clear contrast and classic board game aesthetics.
- Primary text color: Deep grey (#2A2A2A) for excellent readability across the light background and various interface elements.
- Headline and body font: 'Inter' (sans-serif), selected for its modern, clean, and objective aesthetic, ensuring high readability and a professional feel for all interface text, countdowns, and move history.
- Dice-style square pieces for a minimalist and contemporary board game look. Other interface elements will utilize subtle, line-based icons to maintain a clean, unobtrusive visual style.
- A mobile-first responsive layout ensuring optimal viewing and interaction on small screens. The 8x8 game board will be prominently centered, with dedicated player sections (avatar, username, timer) positioned above and below, and a move history section gracefully placed beneath the board.
- Smooth and fluid piece movement animations provide clear visual feedback during turns, while subtle elevation and soft shadow effects add depth and hierarchy to UI components, enhancing user interaction.