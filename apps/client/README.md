# Shopping List PWA

A modern Progressive Web App for managing shopping lists with real-time collaboration features.

## Features

- 📱 **Mobile-First PWA**: Works on all devices, installable on mobile and desktop
- 🔄 **Real-Time Updates**: Live updates using GraphQL subscriptions
- 👥 **Collaborative**: Share lists with others for group shopping
- ⚡ **Fast Performance**: Optimized with Next.js and Tailwind CSS
- 🎨 **Modern UI**: Clean, responsive design with touch-friendly interactions
- 🌐 **Offline Ready**: Basic offline functionality (coming soon)

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Apollo Client** - GraphQL client with caching and subscriptions
- **PWA** - Progressive Web App capabilities

### Backend (Existing)
- **Node.js** with **GraphQL** server
- **Prisma** ORM with **SQLite** database
- **WebSocket** support for real-time subscriptions

## Getting Started

### Prerequisites

Make sure your GraphQL server is running on `http://localhost:4000/graphql`

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

### Environment Variables

Create a `.env.local` file with:
```
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql
```

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
    ├── apollo-client.ts    # Apollo Client configuration
    ├── apollo-wrapper.tsx  # Apollo Provider wrapper
    └── graphql/           # GraphQL operations
        ├── queries.ts      # GraphQL queries
        ├── mutations.ts    # GraphQL mutations
        └── subscriptions.ts # GraphQL subscriptions
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## PWA Features

- **Installable**: Add to home screen on mobile devices
- **Responsive**: Works on all screen sizes
- **Touch Optimized**: Large tap targets and swipe gestures
- **Offline Support**: Basic offline functionality (coming soon)
- **Real-Time**: Live updates when lists change

## GraphQL Integration

The app connects to your existing GraphQL server and supports:

- **Queries**: Fetch users, lists, and items
- **Mutations**: Create, update, and delete operations
- **Subscriptions**: Real-time updates for collaborative features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details