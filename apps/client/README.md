# Shopping List PWA

A modern Progressive Web App for managing shopping lists with real-time collaboration features.

## Features

- 📱 **Mobile-First PWA**: Works on all devices, installable on mobile and desktop
- 🔄 **Real-Time Updates**: Live updates using Supabase Realtime
- 👥 **Collaborative**: Share lists with others for group shopping
- ⚡ **Fast Performance**: Optimized with Next.js and Tailwind CSS
- 🎨 **Modern UI**: Clean, responsive design with touch-friendly interactions
- 🌐 **Offline Ready**: Basic offline functionality (coming soon)

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase JS** - Auth, database, and realtime client
- **PWA** - Progressive Web App capabilities

### Backend Services
- **Supabase Auth** for sign in/sign up
- **Supabase Postgres** for persistent data
- **Supabase Realtime** for live list/item updates

## Getting Started

### Prerequisites

Set these environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── create-user/        # User creation page
│   ├── list/[id]/          # Individual list view
│   ├── user/[id]/lists/    # User's lists dashboard
│   ├── layout.tsx          # Root layout with PWA setup
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # Reusable React components
│   └── ShoppingList.tsx    # Main shopping list component
└── lib/                    # Utilities and configuration
    └── supabase.ts         # Supabase client configuration
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome checks

## PWA Features

- **Installable**: Add to home screen on mobile devices
- **Responsive**: Works on all screen sizes
- **Touch Optimized**: Large tap targets and swipe gestures
- **Offline Support**: Basic offline functionality (coming soon)
- **Real-Time**: Live updates when lists change

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details