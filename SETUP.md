# 🚀 Supabase Setup Guide

Follow these steps to set up your Supabase backend for Farm Tracker.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/Sign in with GitHub (recommended)
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - **Name**: `farm-tracker`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
7. Click "Create new project"
8. Wait 2-3 minutes for setup to complete

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Project API Key** (anon/public key)

## Step 3: Configure Environment Variables

1. In your farm-tracker folder, copy the example file:
   ```bash
   copy .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Set Up Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-setup.sql`
4. Click "Run" to execute the SQL
5. You should see success messages for each command

## Step 5: Configure Storage

1. Go to **Storage** in your Supabase dashboard
2. You should see a bucket called `goat-photos` (created by the SQL)
3. Click on the bucket to verify it's public
4. If needed, you can upload test images here

## Step 6: Test Your Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)
4. Try signing up with a test email
5. Check your email for verification link
6. After verification, try adding a goat

## Step 7: Deploy to Vercel

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/farm-tracker.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

## 🔧 Troubleshooting

### Common Issues:

**"Invalid API key"**
- Double-check your environment variables
- Make sure you're using the anon/public key, not the service key

**"Permission denied"**
- Ensure the SQL setup completed successfully
- Check that RLS policies were created

**Photos not uploading**
- Verify the storage bucket exists and is public
- Check storage policies in SQL editor

**Email verification not working**
- Check spam folder
- In Supabase Auth settings, you can disable email confirmation for testing

### Need Help?

- Check Supabase logs in dashboard
- Review browser console for errors
- Ensure all SQL commands executed successfully

## 🎉 You're Ready!

Once everything is working, you'll have a fully functional, production-ready goat tracking system with:
- ✅ User authentication
- ✅ Secure database with RLS
- ✅ Photo storage
- ✅ Real-time updates
- ✅ Deployed on Vercel