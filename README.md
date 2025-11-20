
  # 🛡️ EvidenceShield

  A blockchain-based evidence management system with Zero-Knowledge Proof (ZKP) verification for secure and tamper-proof evidence handling.

  ## 🚀 Quick Start

  1. **Install dependencies:**
     ```bash
     npm install
     ```

  2. **Set up environment variables:**
     ```bash
     cp .env.example .env
     # Edit .env with your Supabase credentials
     ```

  3. **Run the development server:**
     ```bash
     npm run dev
     ```

  4. **Open your browser:**
     - Visit http://localhost:5173

  ## 📚 Documentation

  - [**Setup Guide**](SETUP_GUIDE.md) - Complete installation and configuration guide
  - [**Start Here**](START_HERE.md) - Overview of the ZKP implementation
  - [**ZKP Documentation**](ZKP_INDEX.md) - Zero-Knowledge Proof technical details

  ## 🏗️ Project Structure

  ```
  evidenceshield/
  ├── src/
  │   ├── components/         # React components
  │   ├── utils/              # Utility functions
  │   │   ├── supabase/       # Supabase integration
  │   │   └── zkp/            # ZKP service
  │   ├── styles/             # Global styles
  │   └── App.tsx             # Main application
  ├── vite.config.ts          # Vite configuration
  ├── tsconfig.json           # TypeScript configuration
  └── package.json            # Dependencies
  ```

  ## 🔧 Available Scripts

  - `npm run dev` - Start development server
  - `npm run build` - Build for production
  - `npm run preview` - Preview production build
  - `npm run lint` - Run ESLint

  ## 🎨 Original Design

  The original Figma design is available at: https://www.figma.com/design/xV6O7O7IfunZzOQUQVw3F5/EvidenceShield
  