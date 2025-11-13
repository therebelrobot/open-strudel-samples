# Strudel Sample Explorer

A React application for searching, loading, and exploring [Strudel](https://strudel.cc/) sound samples from GitHub repositories. Built to discover and play with community-created sound libraries for Strudel live coding.

## Features

- 🔍 **GitHub Search**: Search for `strudel.json` files across all public GitHub repositories
- 📦 **Load Sounds**: Automatically parse and load sound samples from repositories
- 🎵 **Sound Explorer**: Browse loaded sounds with categorization and filtering
- ▶️ **Audio Playback**: Preview sounds directly in the browser
- 💾 **Export/Import**: Save your sound library and restore it later
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 📊 **Local Storage**: Automatically persist your loaded sounds

## Live Demo

Visit the live application: [https://therebelrobot.github.io/open-strudel-samples/](https://therebelrobot.github.io/open-strudel-samples/)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The development server will start at `http://localhost:5173/`

## Usage

### Searching for Sounds

1. Use the search bar to find repositories containing `strudel.json` files
2. The default query `path:/(^|\/)strudel\.json$/` finds all matching files
3. Customize the search query to filter results (e.g., add `user:username` to search specific users)

### Loading Sound Libraries

1. Click "Load Sounds" on any repository card
2. The app will fetch and parse the `strudel.json` file
3. All sounds will be added to your library automatically

### Playing Sounds

1. Switch to the "Sound Library" tab
2. Browse sounds by category or search for specific sounds
3. Click the play button to preview any sound
4. Use the filter and sort options to organize your library

### Export/Import

- **Export**: Download your entire sound library as a JSON file
- **Import**: Upload a previously exported JSON file to restore your library
- **Clear All**: Remove all loaded sounds (with confirmation)

## Project Structure

```

├── src/
│   ├── components/       # React components
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── RepositoryCard.tsx
│   │   ├── RepositoryList.tsx
│   │   ├── SoundCard.tsx
│   │   ├── SoundGrid.tsx
│   │   └── ExportImport.tsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useGitHubSearch.ts
│   │   ├── useStrudelJson.ts
│   │   └── useAudioPlayer.ts
│   ├── store/           # Zustand state management
│   │   └── soundStore.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── github.ts
│   │   └── strudel.ts
│   ├── utils/           # Utility functions
│   │   ├── github-api.ts
│   │   ├── sound-processor.ts
│   │   └── export-import.ts
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Application entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Pages deployment
├── package.json
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── README.md
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Web Audio API** - Audio playback
- **GitHub REST API** - Repository search and content fetching

## GitHub API

This application uses the GitHub REST API to search for and fetch `strudel.json` files:

- **Code Search**: `GET /search/code?q=path:/(^|\/)strudel\.json$/`
- **Raw Content**: `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}`

### Rate Limiting

- **Unauthenticated requests**: 10 requests/minute
- **Authenticated requests**: 30 requests/minute

To use authenticated requests, you would need to add a GitHub personal access token (not currently implemented for security reasons in static sites).

## Strudel.json Format

The application expects sound files to be defined in a `strudel.json` file with the following structure:

```json
{
  "sounds": {
    "category1": ["https://example.com/sound1.wav"],
    "category2": [
      "https://example.com/sound2.mp3",
      "https://example.com/sound3.wav"
    ]
  }
}
```

Alternatively, sounds can be under a `samples` key:

```json
{
  "samples": {
    "drums": ["https://example.com/kick.wav", "https://example.com/snare.wav"],
    "bass": ["https://example.com/bass.wav"]
  }
}
```

## Development

### Local Development

```bash
# Start development server with hot reload
npm run dev
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview the production build locally
npm run preview
```

### Linting

```bash
# Run ESLint
npm run lint
```

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting provider

### GitHub Pages Setup

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the application when changes are pushed to the `main` branch.

To enable GitHub Pages:

1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"
3. Push to main branch to trigger deployment

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Strudel](https://strudel.cc/) - Live coding platform this tool supports
- [GitHub API](https://docs.github.com/en/rest) - Powers the search functionality
- Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and [Tailwind CSS](https://tailwindcss.com/)

## Related Projects

- [Strudel](https://github.com/tidalcycles/strudel) - The main Strudel live coding environment
- [Strudel REPL](https://strudel.cc/) - Online Strudel editor

---

Made with ♥ for the Strudel community
