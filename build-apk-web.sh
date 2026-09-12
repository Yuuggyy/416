#!/bin/bash
# Build du bundle web pour l'APK Android (assets locaux, chemins relatifs, hash routing).
set -e
echo "=== Building 416 Records web bundle (APK) ==="

BUILD_TS=$(date +%s)
rm -rf dist-apk
mkdir -p dist-apk

# 1) JS — entree apk (hash history)
npx esbuild src/apk-entry.tsx \
  --bundle \
  --format=iife \
  --target=es2020 \
  --outfile=dist-apk/app.js \
  --jsx=automatic \
  --alias:@=./src \
  --define:process.env.NODE_ENV='"production"' \
  --external:tailwindcss \
  --minify

# 2) CSS
npx @tailwindcss/cli -i src/styles.css -o dist-apk/app.css --minify

# 3) Icônes
for f in icon-192.png icon-512.png icon-192-maskable.png icon-512-maskable.png favicon.ico; do
  [ -f "public/$f" ] && cp "public/$f" "dist-apk/$f"
done

# 4) index.html — chemins RELATIFS (assets servis depuis file:///android_asset/)
cat > dist-apk/index.html << HTMLEOF
<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="icon" href="icon-192.png" type="image/png" />
  <title>416 Records</title>
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6614933308950023"
     crossorigin="anonymous"></script>
  <style>
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
    #app-loading.hidden { opacity: 0; pointer-events: none; }
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
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <link rel="stylesheet" href="app.css?v=${BUILD_TS}" />
</head>
<body>
  <div id="app-loading">
    <div class="app-loading-logo">416 Records</div>
    <div class="app-loading-spinner"></div>
  </div>
  <div id="root"></div>
  <script src="app.js?v=${BUILD_TS}"></script>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        var el = document.getElementById('app-loading');
        if (el) {
          el.classList.add('hidden');
          setTimeout(function () { el.remove(); }, 400);
        }
      }, 300);
    });
  </script>
</body>
</html>
HTMLEOF

echo "=== Bundle APK complet ==="
ls dist-apk/
