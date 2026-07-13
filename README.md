# Shopping List Monorepo

A shopping list application built with Next.js and Supabase.

## 📁 Project Structure

```
shopping-list-monorepo/
├── apps/
│   ├── client/          # Next.js React frontend
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
npm run dev
```

Or run the client directly:
```bash
npm run dev:client  # Frontend only (port 3000)
```

## 📱 Applications

### Client (Frontend)
- **Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase JS
- **Port:** 3000 (accessible via network: `http://YOUR_IP:3000`)
- **Features:** PWA-ready, phone-optimized shopping lists, Supabase auth, realtime updates

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start frontend in development
- `npm run build` - Build frontend for production
- `npm run lint` - Lint all code
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format all code with Biome
- `npm run clean` - Clean all node_modules and build files

### Individual Apps
- `npm run dev:client` - Start frontend only
- `npm run build:client` - Build frontend

## 🌐 Network Access

The application is configured for network access:
- Frontend: `http://YOUR_IP:3000` (accessible from phones/tablets)

## 🗄️ Database

Supabase provides auth, PostgreSQL storage, and realtime updates. The database includes:
- Users and authentication
- Shopping lists with items
- List sharing capabilities
- Real-time updates via Supabase Realtime

## 🎨 Code Quality

Both apps use Biome for:
- Code formatting
- Linting with modern rules
- Import organization
- Consistent code style

## 📄 License

MIT License - see individual app directories for more details.