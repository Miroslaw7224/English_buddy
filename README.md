# English Agent - AI-Powered English Learning

A modern Next.js application for learning English with AI-powered chat and vocabulary management.

## Features

- 🤖 **AI Chat**: Interactive English conversation with streaming responses
- 📚 **Vocabulary Management**: Add, edit, and organize English words
- 🔐 **Authentication**: Secure user accounts with Supabase
- 📱 **PWA Support**: Install as a mobile app
- 🎨 **Modern UI**: Beautiful interface with Tailwind CSS and shadcn/ui

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **PWA**: next-pwa
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account

### Installation

1. **Clone and install dependencies:**
```bash
cd english-agent
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
english-agent/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── auth/           # Authentication page
│   │   ├── words/          # Vocabulary management
│   │   └── layout.tsx      # Root layout
│   ├── components/         # React components
│   │   ├── auth/          # Auth components
│   │   ├── chat/          # Chat components
│   │   ├── words/         # Words components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Utilities and API
│   ├── stores/            # Zustand stores
│   └── types/             # TypeScript types
├── public/                # Static assets
└── shared/               # Shared utilities
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com/new):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details