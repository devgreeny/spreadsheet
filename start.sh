#!/bin/bash

# The Spreadsheet - Startup Script
echo "🏀 Starting The Spreadsheet..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
ODDS_API_KEY=""
EOF
    echo "✅ Created .env file"
fi

# Check if database exists
if [ ! -f prisma/dev.db ]; then
    echo "📦 Setting up database..."
    npx prisma generate
    npx prisma db push
    echo "✅ Database ready"
else
    echo "✅ Database found"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies found"
fi

echo ""
echo "🚀 Starting development server..."
echo ""
echo "   Your app will be available at:"
echo "   👉 http://localhost:3000"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev

