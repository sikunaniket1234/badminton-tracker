# Badminton Tracker

A React + TypeScript application for tracking badminton matches and managing fines between players.

## Features

- **User Authentication**: Two-user login system (Aniket & Sourav)
- **Match Tracking**: Record match scores and automatically determine winners
- **Fine Management**: Track and manage fines for players
- **Settlement System**: Record payment settlements with transaction IDs
- **Statistics**: View win/loss records and head-to-head statistics
- **Monthly Reports**: Detailed monthly analytics and fine summaries
- **Local Storage**: All data persists in browser local storage
- **Responsive Design**: Works on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Default Credentials

- **Aniket**: Username: `aniketnayak`, Password: `aniket123`
- **Sourav**: Username: `souravssk`, Password: `sourav123`

## Project Structure

```
src/
├── main.tsx           # Entry point
├── App.tsx            # App wrapper
├── badminton-tracker.tsx  # Main component
└── index.css          # Global styles
```

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Vite**: Build tool
- **Local Storage**: Data persistence

## Features in Detail

### Home Tab
- View current fine balance
- Quick actions to record matches or add fines
- Recent activity feed

### Stats Tab
- Individual player statistics (wins, losses, points)
- Head-to-head comparison

### History Tab
- Full chronological history of all matches and fines

### Settlements Tab
- Complete settlement history with payment details

### Monthly Report
- Detailed monthly fine and match statistics
- Settlement records for the selected month

## Data Stored

- **Fines**: Individual fine balances for each player
- **Matches**: All recorded match results
- **Settlements**: Payment settlements with transaction IDs

All data is stored in browser's local storage and persists across sessions.

## License

MIT
