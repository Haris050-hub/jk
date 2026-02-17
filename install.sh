#!/bin/bash

# Hara AI 1.0 Installer

echo -e "\033[0;32m"
echo "  _   _                 _    ___ "
echo " | | | | __ _ _ __ __ _| |  / _ \\"
echo " | |_| |/ _\` | '__/ _\` | | | | | |"
echo " |  _  | (_| | | | (_| |_| | |_| |"
echo " |_| |_|\\__,_|_|  \\__,_(_)  \\___/ "
echo -e "\033[0m"
echo "Installing Hara AI 1.0..."
echo "-----------------------------------"

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js could not be found. Please install Node.js (v18+) first."
    exit 1
fi

echo "✅ Node.js detected."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully."
else
    echo "❌ Failed to install dependencies."
    exit 1
fi

# Start the application
echo "🚀 Starting Hara AI..."
echo "-----------------------------------"
npm run dev
