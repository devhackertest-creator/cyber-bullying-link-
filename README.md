# Cyber Bullying Detection Project

An Instagram-inspired social media feed with real-time cyberbullying detection using weighted lexical analysis and Gemini TTS warnings.

## 🚀 Local Development

Follow these steps to run the project on your local machine:

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Setup
Clone this repository and navigate to the project directory:

```bash
# Install dependencies
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> [!NOTE]
> You can get a free API key from the [Google AI Studio](https://aistudio.google.com/).

### 4. Run the App
Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## ☁️ Deployment (Vercel)

Deploying to Vercel is straightforward for this Vite-based project:

### 1. Push to GitHub
Push your code to a GitHub, GitLab, or Bitbucket repository.

### 2. Connect to Vercel
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"New Project"**.
3. Import your repository.

### 3. Configure Project
Vercel will automatically detect **Vite** as the framework. Ensure the following settings are correct:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

### 4. Add Environment Variables
In the **"Environment Variables"** section, add:
- `GEMINI_API_KEY`: Your Google Gemini API Key.

### 5. Deploy
Click **"Deploy"**. Once finished, Vercel will provide you with a production URL.

---

## 🛡️ Key Features
- **Real-time Detection**: Analyzes comments as you type using a 100+ word dictionary and contextual patterns.
- **Authoritative TTS**: Triggers a voice warning using Gemini TTS when bullying is detected.
- **Admin Dashboard**: Moderation queue for reviewing flagged and reported comments.
- **Dark Mode**: Fully responsive UI with Instagram-inspired aesthetics.
