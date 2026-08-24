#!/bin/bash
set -e

echo "=== Building 416 Records SPA ==="

BUILD_TS=$(date +%s)

# Build JS with esbuild
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

# Create index.html with inline loading state (fix écran noir PWA)
echo "Creating index.html..."
cat > dist/index.html << HTMLEOF
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
  <title>416 Records</title>
  <style>
    /* Loading state inline — affiché immédiatement avant que le JS se charge */
    #app-loading {
      position: fixed;
      inset: 0;
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 9999;
      transition: opacity 0.3s ease;
    }
    #app-loading.hidden {
      opacity: 0;
      pointer-events: none;
    }
    .app-loading-logo {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 28px;
      font-weight: 800;
      color: #a855f7;
      letter-spacing: -0.02em;
    }
    .app-loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(168, 85, 247, 0.2);
      border-top-color: #a855f7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <link rel="stylesheet" href="/app.css?v=${BUILD_TS}" />
</head>
<body>
  <div id="app-loading">
    <div class="app-loading-logo">416 Records</div>
    <div class="app-loading-spinner"></div>
  </div>
  <div id="root"></div>
  <script type="module" src="/app.js?v=${BUILD_TS}"></script>
  <script>
    // Cacher le loading quand React est monté
    window.addEventListener('load', function() {
      setTimeout(function() {
        var el = document.getElementById('app-loading');
        if (el) {
          el.classList.add('hidden');
          setTimeout(function() { el.remove(); }, 400);
        }
      }, 300);
    });
  </script>
</body>
</html>
HTMLEOF

# Create 404.html (SPA fallback)
cp dist/index.html dist/404.html

# Create _redirects for SPA routing
echo "/*  /index.html  200" > dist/_redirects

echo "=== Build complete ==="
ls -la dist/
