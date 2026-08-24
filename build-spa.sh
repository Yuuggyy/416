#!/bin/bash
set -e

echo "=== Building 416 Records SPA ==="

# Build JS with esbuild (minified, production)
echo "Building JS..."
npx esbuild src/spa-entry.tsx \
  --bundle \
  --format=esm \
  --target=es2020 \
  --outfile=dist/app.js \
  --jsx=automatic \
  --alias:@=./src \
  --define:process.env.NODE_ENV='"production"' \
  --external:tailwindcss \
  --minify

# Build CSS with Tailwind
echo "Building CSS..."
npx @tailwindcss/cli -i src/styles.css -o dist/app.css --minify

# Copy static files
echo "Copying static files..."
cp public/sw.js dist/sw.js
cp public/manifest.webmanifest dist/manifest.webmanifest
cp public/icon-192.png dist/icon-192.png 2>/dev/null || true
cp public/icon-512.png dist/icon-512.png 2>/dev/null || true
cp public/icon-192-maskable.png dist/icon-192-maskable.png 2>/dev/null || true
cp public/icon-512-maskable.png dist/icon-512-maskable.png 2>/dev/null || true

# Create index.html
echo "Creating index.html..."
cat > dist/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="manifest" href="/manifest.webmanifest" />
  <link rel="icon" href="/icon-192.png" type="image/png" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="416 Records" />
  <title>416 Records — Films, musique, une seule maison</title>
  <link rel="stylesheet" href="/app.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>
HTMLEOF

# Create 404.html (SPA fallback)
cp dist/index.html dist/404.html

# Create _redirects for SPA routing
echo "/*  /index.html  200" > dist/_redirects

echo "=== Build complete ==="
ls -la dist/
