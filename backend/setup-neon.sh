#!/bin/bash

# Neon Database Setup Script for MLM Backend
# This script helps you set up the Neon database connection

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         MLM Backend - Neon Database Setup                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
fi

echo "📋 Setup Checklist:"
echo "-------------------"
echo "1. ☐ Create a Neon account at https://console.neon.tech/"
echo "2. ☐ Create a new project in Neon Console"
echo "3. ☐ Copy the connection strings from Neon Console"
echo ""

echo "🔗 You need TWO connection strings from Neon:"
echo ""
echo "   A) Pooled Connection (for DATABASE_URL):"
echo "      - Go to: Connection Details > Pooled connection"
echo "      - Should contain: pgbouncer=true"
echo ""
echo "   B) Direct Connection (for DIRECT_URL):"
echo "      - Go to: Connection Details > Direct connection"
echo "      - No pgbouncer parameter"
echo ""

read -p "Have you copied both connection strings? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Please get your connection strings first, then run this script again."
    exit 1
fi

echo ""
echo "📝 Please enter your Neon connection details:"
echo ""

read -p "Enter DATABASE_URL (pooled connection): " DATABASE_URL
read -p "Enter DIRECT_URL (direct connection): " DIRECT_URL

# Update .env file
if [[ -n "$DATABASE_URL" && -n "$DIRECT_URL" ]]; then
    # Escape special characters for sed
    DATABASE_URL_ESCAPED=$(echo "$DATABASE_URL" | sed 's/[&/\]/\\&/g')
    DIRECT_URL_ESCAPED=$(echo "$DIRECT_URL" | sed 's/[&/\]/\\&/g')
    
    # Update the .env file
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$DATABASE_URL_ESCAPED|" .env
    sed -i "s|^DIRECT_URL=.*|DIRECT_URL=$DIRECT_URL_ESCAPED|" .env
    
    echo ""
    echo "✅ Updated .env file with your Neon connection strings"
else
    echo "❌ Connection strings cannot be empty"
    exit 1
fi

echo ""
echo "🔧 Running Prisma setup..."
echo ""

# Generate Prisma Client
echo "1️⃣  Generating Prisma Client..."
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated"
else
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

echo ""
echo "2️⃣  Testing database connection..."
npx prisma db pull --force

if [ $? -eq 0 ]; then
    echo "✅ Successfully connected to Neon database"
else
    echo "❌ Failed to connect to database. Please check your connection strings."
    exit 1
fi

echo ""
read -p "Would you like to run migrations now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "3️⃣  Running migrations..."
    npx prisma migrate deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations completed successfully"
    else
        echo "⚠️  Migrations failed. You may need to run them manually."
    fi
fi

echo ""
read -p "Would you like to seed the database with initial data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "4️⃣  Seeding database..."
    npm run seed
    
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Seeding failed. You may need to run it manually with 'npm run seed'"
    fi
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! 🎉                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Start Redis: docker-compose up -d"
echo "  2. Start the server: npm run dev"
echo ""
echo "📚 For more information, see:"
echo "   - NEON_SETUP.md - Detailed Neon setup guide"
echo "   - DATABASE_MIGRATION.md - Migration documentation"
echo ""
