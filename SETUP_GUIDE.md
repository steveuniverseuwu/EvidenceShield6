# 🚀 Setup Guide - EvidenceShield

This guide will help you set up the project after cloning from GitHub.

---

## 📋 Prerequisites

Before you begin, make sure you have:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- A **Supabase account** - [Sign up here](https://supabase.com/)
- **Git** installed

---

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd evidenceshield
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your actual Supabase values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

**Where to find these values:**
1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Project API keys** → `anon` `public` → `VITE_SUPABASE_ANON_KEY`
   - **Project Reference ID** → `VITE_SUPABASE_PROJECT_ID`

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

The application should now be running at:
- **Local**: http://localhost:5173
- **Network**: Check the terminal output for the network URL

---

## 📁 Project Structure

```
evidenceshield/
├── .env                    # Your secrets (NOT committed to Git)
├── .env.example            # Template for environment variables
├── .gitignore              # Files to exclude from Git
├── package.json            # Project dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── index.html              # HTML entry point
├── src/
│   ├── components/         # React components
│   ├── utils/              # Utility functions
│   │   ├── supabase/       # Supabase configuration
│   │   └── zkp/            # Zero-Knowledge Proof service
│   ├── styles/             # Global styles
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
└── ...
```

---

## 🔐 Security Notes

⚠️ **IMPORTANT**: Never commit the following files to Git:
- `.env` - Contains your secret keys
- `node_modules/` - Large folder with dependencies

These are already excluded in `.gitignore`.

---

## 🛠️ Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## 🐛 Troubleshooting

### Error: "VITE_SUPABASE_URL is not defined"
- Make sure you've created the `.env` file from `.env.example`
- Verify that all environment variables are filled in correctly
- Restart the dev server after changing `.env`

### Error: \"Cannot find module...\"
- Run `npm install` in the root directory
- Delete `node_modules/` and `package-lock.json`, then reinstall

### Supabase connection issues
- Verify your credentials in the Supabase dashboard
- Check that your project is not paused (free tier projects pause after inactivity)
- Ensure Row Level Security (RLS) policies are configured correctly

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🤝 Contributing

If you're contributing to this project:
1. Never commit `.env` files
2. Update `.env.example` if you add new environment variables
3. Document any new setup steps in this guide

---

## 📧 Support

If you encounter any issues, please:
1. Check the troubleshooting section above
2. Review closed issues in the repository
3. Open a new issue with detailed information

---

**Happy coding! 🎉**
