# 🚛 Fuel-Ops: Dispatch & Reporting System

A comprehensive fuel dispatch operations and reporting platform built with Next.js, TypeScript, Prisma, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)

## ✨ Features

### 📊 Six Comprehensive Reports

1. **Daily Program Summary** - Overview of planned vs served liters, runs completed, and exceptions per program
2. **Station Delivery Ledger** - Complete delivery history per station with DR/POD tracking
3. **Dispatch Run Liquidation** - Detailed uplift, drop, and heel totals per run with variance tracking
4. **Exceptions Register** - Monitor all gain/loss variances and missing PODs with clearing status
5. **POD Completeness** - Analyze POD attachment rates by date, station, porter, or tanker
6. **Productivity Summary** - Operational KPIs: runs, liters delivered, and efficiency metrics

### 🎯 Key Capabilities

- **Flexible Filtering** - Date ranges, tankers, stations, products, drivers, porters
- **CSV Export** - Download any report as Excel-friendly CSV
- **Mock Data Mode** - Develop locally without database setup
- **Supabase Integration** - Production-ready PostgreSQL backend
- **Beautiful UI** - Modern, responsive design with Tailwind CSS
- **Type-Safe** - Full TypeScript coverage with Prisma ORM

## 🚀 Quick Start

### Option 1: Run with Mock Data (No Setup Required)

```bash
# Clone the repository
git clone <your-repo-url>
cd fuel-ops

# Install dependencies
npm install

# Run in development mode with mock data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and navigate to **Reports** to see all 6 reports populated with realistic mock data.

### Option 2: Run with Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com]( https://supabase.com)
   - Create a new project
   - Copy your project URL and keys

2. **Configure Environment Variables**

Create `.env.local` file:

```env
# Disable mock data
USE_MOCK_DATA=false
NEXT_PUBLIC_USE_MOCK_DATA=false

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URLs from Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.com:5432/postgres
```

3. **Sync Database Schema**

```bash
npx prisma db push
```

4. **Run the Application**

```bash
npm run dev
```

## 📁 Project Structure

```
fuel-ops/
├── app/
│   ├── api/reports/          # API routes for all 6 reports
│   ├── reports/              # Report UI pages
│   ├── layout.tsx            # Root layout with navigation
│   └── page.tsx              # Landing page
├── components/reports/       # Reusable UI components
│   ├── DateRangePicker.tsx
│   ├── ExportButton.tsx
│   └── ReportTable.tsx
├── lib/
│   ├── services/
│   │   ├── report-service.ts      # Report business logic
│   │   ├── mock-data-service.ts   # Mock data generator
│   │   └── csv-exporter.ts        # CSV export utility
│   ├── supabase/             # Supabase client setup
│   ├── prisma.ts             # Prisma client
│   └── types.ts              # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
└── package.json
```

## 🗄️ Database Schema

The system includes entities for:

- **Users** - Role-based access (Management, Audit, Dispatcher, Porter, Supervisor, Driver)
- **Tankers** - Fleet management
- **Stations** - Delivery locations
- **FuelTypes** - Product catalog (Diesel, Unleaded, Premium)
- **DailyPrograms** - Daily dispatch plans
- **DispatchRuns** - Individual delivery runs
- **Uplifts** - Fuel loading records
- **Drops** - Fuel delivery records
- **PODAttachments** - Proof of delivery files
- **Heels** - Remaining fuel tracking
- **Exceptions** - Variance and compliance tracking
- **AuditLog** - Full audit trail

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Date Handling**: date-fns

## 📊 API Endpoints

All reports support both JSON and CSV formats:

```
GET /api/reports/daily-program-summary?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
GET /api/reports/station-ledger?dateFrom=...&dateTo=...&stationId=...
GET /api/reports/run-liquidation?dateFrom=...&dateTo=...&varianceOnly=true
GET /api/reports/exceptions?dateFrom=...&dateTo=...&unclearedOnly=true
GET /api/reports/pod-completeness?dateFrom=...&dateTo=...&groupBy=date
GET /api/reports/productivity?dateFrom=...&dateTo=...&groupBy=tanker
```

Add `&format=csv` or use `.csv` extension for CSV export.

## 🔧 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `USE_MOCK_DATA` | Set to `true` for mock data mode | Development |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Production |
| `DATABASE_URL` | PostgreSQL connection URL (pooled) | Production |
| `DIRECT_URL` | PostgreSQL connection URL (direct) | Migrations |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for fuel dispatch operations management.

---

**Need Help?** Check the `.env.local` file for configuration examples and refer to the Supabase documentation for database setup.
