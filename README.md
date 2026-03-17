# Shopping List Monorepo

A full-stack shopping list application built with Next.js, GraphQL, and Prisma.

## 📁 Project Structure

```
shopping-list-monorepo/
├── apps/
│   ├── client/          # Next.js React frontend
│   └── server/          # GraphQL API server with Prisma
├── package.json         # Root workspace configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/kenmckaba/shopping-list-monorepo.git
cd shopping-list-monorepo
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development servers:**
```bash
npm run dev  # Starts both client and server
```

Or start individually:
```bash
npm run dev:client  # Frontend only (port 3000)
npm run dev:server  # Backend only (port 4000)
```

## 📱 Applications

### Client (Frontend)
- **Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Apollo Client
- **Port:** 3000 (accessible via network: `http://YOUR_IP:3000`)
- **Features:** PWA-ready, phone-optimized shopping lists

### Server (Backend)
- **Tech Stack:** GraphQL, Apollo Server, Prisma, SQLite, TypeScript
- **Port:** 4000
- **Features:** Real-time subscriptions, user management, list sharing

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start both apps in development
- `npm run build` - Build both apps for production
- `npm run lint` - Lint all code
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format all code with Biome
- `npm run clean` - Clean all node_modules and build files

### Individual Apps
- `npm run dev:client` - Start frontend only
- `npm run dev:server` - Start backend only
- `npm run build:client` - Build frontend
- `npm run build:server` - Build backend

## 🌐 Network Access

The application is configured for network access:
- Frontend: `http://YOUR_IP:3000` (accessible from phones/tablets)
- Backend: `http://YOUR_IP:4000/graphql`

## 🗄️ Database

The server uses Prisma with SQLite for data persistence. The database includes:
- Users and authentication
- Shopping lists with items
- List sharing capabilities
- Real-time updates via GraphQL subscriptions

## 🎨 Code Quality

Both apps use Biome for:
- Code formatting
- Linting with modern rules
- Import organization
- Consistent code style

## 📄 License

MIT License - see individual app directories for more details.