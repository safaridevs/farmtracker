# 🐐 Farm Tracker - Modern Goat Management System

A modern, production-ready goat tracking application built with Next.js 14, Supabase, and TypeScript.

## ✨ Features

- **🔐 Authentication**: Secure login/signup with Supabase Auth
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **📸 Photo Upload**: Upload and manage goat and tag photos
- **🔍 Advanced Filtering**: Filter by tag number, owner, and gender
- **⚡ Real-time Updates**: Live data synchronization
- **🚀 Production Ready**: Optimized for Vercel deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (Database, Auth, Storage)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL commands from `supabase-setup.sql` in your Supabase SQL editor
3. Copy your project URL and anon key

### 3. Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📦 Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 🗄️ Database Schema

### Goats Table
- `id` (UUID, Primary Key)
- `tag_number` (Text, Unique)
- `owner_name` (Text)
- `gender` (Text: 'Male' or 'Female')
- `goat_photo_url` (Text, Optional)
- `tag_photo_url` (Text, Optional)
- `created_at` (Timestamp)
- `created_by` (UUID, Foreign Key to auth.users)

## 🔒 Security Features

- Row Level Security (RLS) enabled
- Users can only modify their own records
- Secure file upload with proper policies
- Authentication required for all operations

## 🎯 Next Steps

- [ ] Add goat health tracking
- [ ] Implement breeding records
- [ ] Add export functionality
- [ ] Mobile app with React Native
- [ ] Advanced analytics dashboard

## 📄 License

MIT License - feel free to use this project for your farm management needs!