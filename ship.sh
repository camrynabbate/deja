#!/bin/bash
set -e

echo "==> Pulling latest code..."
git pull

echo "==> Installing dependencies..."
npm install

echo "==> Building, signing, and uploading to TestFlight..."
bundle exec fastlane beta

echo ""
echo "Done! Check App Store Connect for your TestFlight build."
