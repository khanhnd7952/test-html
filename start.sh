#!/bin/bash

echo "========================================"
echo "  AdData JSON Serializer Tool v2.0"
echo "========================================"
echo

echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "Node.js version:"
node --version

echo
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi

echo
echo "Initializing database..."
npm run init-db

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to initialize database"
    exit 1
fi

echo
echo "Starting the application..."
echo
echo "========================================"
echo "  Server will start at http://localhost:3000"
echo "  Press Ctrl+C to stop the server"
echo "========================================"
echo

npm start
