#!/bin/bash
# Build 416 Records pour GitHub Pages (sous-dossier).
# BASE_PATH : chemin public du site. Par défaut /416/ (project page yuuggyy.github.io/416/).
# Pour un domaine racine : BASE_PATH=/ bash build-pages.sh
set -e

BASE_PATH="${BASE_PATH:-/416/}"
# garantir le slash initial et final
case "$BASE_PATH" in
  /*/) ;;
  /*) BASE_PATH="$BASE_PATH/" ;;
  *) BASE_PATH="/$BASE_PATH/" ;;
esac
echo "=== Building 416 Records SPA — base path: $BASE_PATH ==="

BUILD_TS=$(date +%s)

rm -rf dist
mkdir -p dist

# 1) JS (esbuild) — le basepath du routeur est injecté via import.meta.env.BASE_PATH
echo "Building JS..."
npx esbuild src/spa-entry.tsx \
  --bundle \
  --format=esm \
  --target=es2020 \
  --outfile=dist/app.js \
  --jsx=automatic \
  --alias:@=./src \
  --define:process.env.NODE_ENV='"production"' \
  --define:import.meta.env.BASE_PATH='"'$BASE_PATH'"' \
  --external:tailwindcss \
  --minify

# 2) CSS
echo "Building CSS..."
npx @tailwindcss/cli -i src/styles.css -o dist/app.css --minify

# 3) Assets statiques (avec préfixe de sous-dossier)
echo "Copying static files..."
for f in sw.js manifest.webmanifest icon-192.png icon-512.png icon-192-maskable.png icon-512-maskable.png favicon.ico; do
  [ -f "public/$f" ] && cp "public/$f" "dist/$f"
done

# sw.js : BASE du service worker aligné sur le sous-dossier
sed -i.bak "s|^const BASE = .*$|const BASE = '$BASE_PATH';|" dist/sw.js && rm -f dist/sw.js.bak

# manifest : start_url, scope et icônes préfixés
sed -i.bak \
  -e "s|\"start_url\": \"/\"|\"start_url\": \"$BASE_PATH\"|" \
  -e "s|\"scope\": \"/\"|\"scope\": \"$BASE_PATH\"|" \
  -e "s|\"src\": \"/icon|\"src\": \"${BASE_PATH}icon|g" \
  dist/manifest.webmanifest && rm -f dist/manifest.webmanifest.bak

# 4) index.html
echo "Creating index.html..."
cat > dist/index.html << HTMLEOF
<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0a0a0a" />
  <link rel="manifest" href="${BASE_PATH}manifest.webmanifest" />
  <link rel="icon" href="${BASE_PATH}icon-192.png" type="image/png" />
  <link rel="apple-touch-icon" href="${BASE_PATH}icon-192.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="416 Records" />
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
  <link rel="stylesheet" href="${BASE_PATH}app.css?v=${BUILD_TS}" />
</head>
<body>
  <div id="app-loading">
    <div class="app-loading-logo">416 Records</div>
    <div class="app-loading-spinner"></div>
  </div>
  <div id="root"></div>
  <script type="module" src="${BASE_PATH}app.js?v=${BUILD_TS}"></script>
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

# 5) 404.html — fallback SPA officiel de GitHub Pages
cp dist/index.html dist/404.html

# 6) .nojekyll — servir les assets commençant par _ sans Jekyll
touch dist/.nojekyll

echo "=== Build complete ==="
ls -la dist/
