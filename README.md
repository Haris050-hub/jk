# Hara AI 1.0

A next-generation conversational AI assistant featuring a sleek, emerald-themed interface, real-time voice dictation, and robust session management. Built with React, Tailwind CSS, and the Google Gemini API.

![Hara AI](https://placehold.co/600x400/064e3b/34d399?text=Hara+AI+1.0)

## ✨ Features

- **Advanced AI Chat**: Powered by Google's `gemini-2.0-flash-lite-preview` model for fast and intelligent responses.
- **Real-time Dictation**: Talk to the AI naturally. The interface types as you speak (Speech-to-Text).
- **Image Generation**: Detects prompts like "generate image of..." and creates visuals using Pollinations AI.
- **Text-to-Speech**: Read messages aloud with a single click.
- **Multi-Session History**: Automatically saves and organizes your conversations.
- **Admin Panel**: A complete dashboard to manage users, suspend accounts, and configure global API keys.
- **Dark/Light Mode**: Fully responsive theme switching with an emerald accent.
- **Secure Authentication**: Built-in user management system with role-based access control (User/Admin/Master).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository or download the source code.
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

## 🔑 Default Credentials

The application comes with a built-in **Master Admin** account. Use these credentials to access the Admin Panel immediately:

- **Username:** `Dark`
- **Password:** `darkop`

> **Note:** You can create standard user accounts directly from the login screen by toggling to "Register".

## ⚙️ Configuration

### API Keys

Hara AI uses the Google GenAI SDK. You have two ways to configure the API Key:

1. **Environment Variable**: Create a `.env` file in the root directory:
   ```env
   API_KEY=your_google_gemini_api_key
   ```
2. **Admin Panel**: Log in as an Admin (or the Master account), go to **Settings**, and enter a "Global API Key". This key will be used for all users who don't provide their own.

### Image Generation

Image generation is handled via keyword detection. Try prompts like:
- "Generate an image of a cyberpunk city"
- "Draw a cat in space"
- "Visualize a futuristic car"

## 🎤 How to Use Voice Dictation

1. Click the **Microphone** icon in the input bar.
2. The placeholder will change to "Listening...".
3. Speak naturally. Your words will appear in the input box in real-time.
4. You can edit the text manually if needed.
5. Click **Send** or press Enter.
6. Click the Microphone icon again to stop listening.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI Integration**: @google/genai SDK
- **Icons**: Lucide React
- **Markdown**: React Markdown
- **Storage**: LocalStorage (for persistence of chats and users)

## 🛡️ Admin Features

Access the Admin Panel via the Sidebar to:
- **Dashboard**: View real-time statistics (User count, Message count, Storage usage).
- **User Management**: Create users, suspend/ban users, promote users to Admin, or delete accounts.
- **System Settings**: Set global API keys and perform database resets.

---

*Hara AI 1.0 - Designed for efficiency and aesthetics.*
