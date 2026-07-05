#!/bin/bash
# ──────────────────────────────────────────────────────
#  déjà → TestFlight  (double-click to run)
# ──────────────────────────────────────────────────────
set -e

bold="\033[1m"
dim="\033[2m"
green="\033[32m"
red="\033[31m"
reset="\033[0m"

step() { echo -e "\n${bold}▸ $1${reset}"; }
ok()   { echo -e "  ${green}✓${reset} $1"; }
fail() { echo -e "  ${red}✗ $1${reset}"; echo -e "\n  Fix the above and double-click this file again."; echo; read -n 1 -s -r -p "  Press any key to close..."; exit 1; }

echo -e "${bold}"
echo "  ┌──────────────────────────────┐"
echo "  │   déjà → TestFlight          │"
echo "  └──────────────────────────────┘"
echo -e "${reset}"

# ── 1. Locate the repo ──────────────────────────────
step "Finding your déjà project..."

REPO=""
for dir in \
  "$HOME/Desktop/deja" \
  "$HOME/Documents/deja" \
  "$HOME/Developer/deja" \
  "$HOME/Projects/deja" \
  "$HOME/Code/deja" \
  "$HOME/deja" \
  "$HOME/Desktop/System/deja-CA/deja" \
  "$HOME/repos/deja"; do
  if [ -d "$dir/.git" ]; then
    REPO="$dir"
    break
  fi
done

if [ -z "$REPO" ]; then
  REPO=$(find "$HOME" -maxdepth 4 -name ".git" -path "*/deja/.git" -type d 2>/dev/null | head -1 | sed 's/\/.git$//')
fi

if [ -z "$REPO" ]; then
  echo -e "  Couldn't find the deja repo automatically."
  echo -e "  ${dim}Drag your deja project folder into this window and press Enter:${reset}"
  read -r REPO
  REPO=$(echo "$REPO" | sed "s/^ *//;s/ *$//;s/\\\\//g;s/'//g")
fi

if [ ! -d "$REPO/.git" ]; then
  fail "Not a git repo: $REPO"
fi

ok "Found project at $REPO"
cd "$REPO"

# ── 2. Check prerequisites ──────────────────────────
step "Checking prerequisites..."

if ! xcode-select -p &>/dev/null; then
  echo "  Installing Xcode Command Line Tools (this takes a few minutes)..."
  xcode-select --install
  echo -e "  ${dim}After install finishes, double-click this file again.${reset}"
  read -n 1 -s -r -p "  Press any key to close..."
  exit 0
fi
ok "Xcode CLI tools"

if ! command -v node &>/dev/null; then
  fail "Node.js not found. Install it from https://nodejs.org (LTS version)"
fi
ok "Node.js $(node -v)"

if ! command -v npm &>/dev/null; then
  fail "npm not found. Reinstall Node.js from https://nodejs.org"
fi
ok "npm $(npm -v)"

if ! command -v ruby &>/dev/null; then
  fail "Ruby not found (should come with macOS)"
fi
ok "Ruby $(ruby -v | awk '{print $2}')"

# ── 3. Install Fastlane if needed ────────────────────
step "Setting up Fastlane..."

if ! command -v bundle &>/dev/null; then
  echo "  Installing Bundler..."
  gem install bundler --user-install 2>/dev/null || sudo gem install bundler
fi
ok "Bundler"

if [ ! -f "Gemfile.lock" ] || ! bundle check &>/dev/null; then
  echo "  Installing Fastlane (first time only, takes a minute)..."
  bundle install
fi
ok "Fastlane installed"

# ── 4. Pull latest code ─────────────────────────────
step "Pulling latest code from GitHub..."
git pull origin main
ok "Up to date"

# ── 5. Install JS dependencies ──────────────────────
step "Installing JavaScript dependencies..."
npm install --silent
ok "Dependencies installed"

# ── 6. Build and deploy ─────────────────────────────
step "Building app and uploading to TestFlight..."
echo -e "  ${dim}(Fastlane may ask you to sign in with your Apple ID)${reset}"
echo ""

bundle exec fastlane beta

echo ""
echo -e "${bold}${green}  ┌──────────────────────────────────────────────┐${reset}"
echo -e "${bold}${green}  │   Done! Check App Store Connect / TestFlight  │${reset}"
echo -e "${bold}${green}  └──────────────────────────────────────────────┘${reset}"
echo ""
read -n 1 -s -r -p "  Press any key to close..."
