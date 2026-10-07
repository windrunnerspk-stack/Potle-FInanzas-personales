const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// SVG with full squircle background for standard launcher & app icons
const fullIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c1220"/>
      <stop offset="50%" stop-color="#070a13"/>
      <stop offset="100%" stop-color="#03050a"/>
    </linearGradient>

    <!-- Outer Aura Glow -->
    <radialGradient id="auraGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Rim Light Gradient -->
    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.1"/>
    </linearGradient>

    <!-- Left Pillar Gradient (Emerald to Teal) -->
    <linearGradient id="leftStem" x1="0%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="45%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>

    <!-- Right Pillar Gradient (Teal to Electric Cyan) -->
    <linearGradient id="rightStem" x1="50%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="55%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>

    <!-- Ascending Financial Chevron/Crossbar -->
    <linearGradient id="chevronGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#6ee7b7"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>

    <!-- Star Glow -->
    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Squircle Base -->
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="url(#bgGrad)"/>
  
  <!-- Outer Aura Halo -->
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="url(#auraGlow)"/>
  
  <!-- Border Rim -->
  <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="none" stroke="url(#rimGrad)" stroke-width="4"/>

  <!-- Orbital Ring Behind (Financial Stability & Aura) -->
  <circle cx="256" cy="275" r="145" fill="none" stroke="#10b981" stroke-opacity="0.12" stroke-width="28"/>
  <circle cx="256" cy="275" r="145" fill="none" stroke="#06b6d4" stroke-opacity="0.22" stroke-width="3" stroke-dasharray="16 12"/>

  <!-- Iconic Monogram "A" (Aura & Ascending Finance) -->
  <g filter="url(#glowFilter)">
    <!-- Left Ascending Stem -->
    <path d="M 256 102 L 138 376 C 134 385 140 396 150 396 L 194 396 C 201 396 207 392 210 385 L 256 270 L 256 102 Z"
          fill="url(#leftStem)" />

    <!-- Right Ascending Stem -->
    <path d="M 256 102 L 256 270 L 302 385 C 305 392 311 396 318 396 L 362 396 C 372 396 378 385 374 376 L 256 102 Z"
          fill="url(#rightStem)" />

    <!-- Center Upward Dynamic Arrow / Crossbar (Growth & Wealth) -->
    <path d="M 188 332 L 256 264 L 324 332 L 298 348 L 256 306 L 214 348 Z"
          fill="url(#chevronGrad)" />

    <!-- Apex Diamond Beacon (Clarity, Prosperity & Vision) -->
    <path d="M 256 80 L 264 100 L 284 108 L 264 116 L 256 136 L 248 116 L 228 108 L 248 100 Z"
          fill="#ffffff" />
  </g>

  <!-- Sub-sparkle highlight -->
  <circle cx="256" cy="108" r="4" fill="#6ee7b7" />
</svg>
`;

// Circular Icon (For ic_launcher_round.png)
const roundIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c1220"/>
      <stop offset="50%" stop-color="#070a13"/>
      <stop offset="100%" stop-color="#03050a"/>
    </linearGradient>

    <radialGradient id="auraGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="rimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#06b6d4" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.1"/>
    </linearGradient>

    <linearGradient id="leftStem" x1="0%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="45%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>

    <linearGradient id="rightStem" x1="50%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="55%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>

    <linearGradient id="chevronGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#6ee7b7"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>

    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Circular Base -->
  <circle cx="256" cy="256" r="240" fill="url(#bgGrad)"/>
  <circle cx="256" cy="256" r="240" fill="url(#auraGlow)"/>
  <circle cx="256" cy="256" r="240" fill="none" stroke="url(#rimGrad)" stroke-width="4"/>

  <!-- Orbital Ring Behind -->
  <circle cx="256" cy="275" r="145" fill="none" stroke="#10b981" stroke-opacity="0.12" stroke-width="28"/>
  <circle cx="256" cy="275" r="145" fill="none" stroke="#06b6d4" stroke-opacity="0.22" stroke-width="3" stroke-dasharray="16 12"/>

  <!-- Iconic Monogram "A" -->
  <g filter="url(#glowFilter)">
    <path d="M 256 102 L 138 376 C 134 385 140 396 150 396 L 194 396 C 201 396 207 392 210 385 L 256 270 L 256 102 Z"
          fill="url(#leftStem)" />
    <path d="M 256 102 L 256 270 L 302 385 C 305 392 311 396 318 396 L 362 396 C 372 396 378 385 374 376 L 256 102 Z"
          fill="url(#rightStem)" />
    <path d="M 188 332 L 256 264 L 324 332 L 298 348 L 256 306 L 214 348 Z"
          fill="url(#chevronGrad)" />
    <path d="M 256 80 L 264 100 L 284 108 L 264 116 L 256 136 L 248 116 L 228 108 L 248 100 Z"
          fill="#ffffff" />
  </g>
  <circle cx="256" cy="108" r="4" fill="#6ee7b7" />
</svg>
`;

// Foreground SVG for Android Adaptive Icon (No solid background, centered on 108dp canvas with 72dp safe zone)
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="fgAura" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="fgLeftStem" x1="0%" y1="100%" x2="50%" y2="0%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="45%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>

    <linearGradient id="fgRightStem" x1="50%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="55%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>

    <linearGradient id="fgChevron" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="50%" stop-color="#6ee7b7"/>
      <stop offset="100%" stop-color="#a7f3d0"/>
    </linearGradient>

    <filter id="fgGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Translucent Aura -->
  <circle cx="256" cy="256" r="200" fill="url(#fgAura)"/>

  <!-- Orbital Ring -->
  <circle cx="256" cy="270" r="130" fill="none" stroke="#10b981" stroke-opacity="0.2" stroke-width="20"/>
  <circle cx="256" cy="270" r="130" fill="none" stroke="#06b6d4" stroke-opacity="0.35" stroke-width="2.5" stroke-dasharray="14 10"/>

  <!-- Scaled Monogram for 66% Android Safe Zone -->
  <g transform="translate(40, 30) scale(0.84)" filter="url(#fgGlow)">
    <path d="M 256 102 L 138 376 C 134 385 140 396 150 396 L 194 396 C 201 396 207 392 210 385 L 256 270 L 256 102 Z"
          fill="url(#fgLeftStem)" />
    <path d="M 256 102 L 256 270 L 302 385 C 305 392 311 396 318 396 L 362 396 C 372 396 378 385 374 376 L 256 102 Z"
          fill="url(#fgRightStem)" />
    <path d="M 188 332 L 256 264 L 324 332 L 298 348 L 256 306 L 214 348 Z"
          fill="url(#fgChevron)" />
    <path d="M 256 80 L 264 100 L 284 108 L 264 116 L 256 136 L 248 116 L 228 108 L 248 100 Z"
          fill="#ffffff" />
    <circle cx="256" cy="108" r="4" fill="#6ee7b7" />
  </g>
</svg>
`;

// Splash screen generator (creates centered logo on dark obsidian background)
function createSplashSvg(width, height) {
  const logoScale = Math.min(width, height) * 0.42 / 512;
  const offsetX = (width - 512 * logoScale) / 2;
  const offsetY = (height - 512 * logoScale) / 2;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="splashBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b101c"/>
      <stop offset="50%" stop-color="#060912"/>
      <stop offset="100%" stop-color="#03050a"/>
    </linearGradient>
    <radialGradient id="splashHalo" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.25"/>
      <stop offset="40%" stop-color="#06b6d4" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="url(#splashBg)" />
  <circle cx="${width/2}" cy="${height/2}" r="${Math.min(width, height)*0.45}" fill="url(#splashHalo)" />

  <g transform="translate(${offsetX}, ${offsetY}) scale(${logoScale})">
    <!-- Embedded Full Icon -->
    <rect x="16" y="16" width="480" height="480" rx="112" ry="112" fill="#080c16" stroke="#10b981" stroke-opacity="0.4" stroke-width="4"/>
    <circle cx="256" cy="275" r="145" fill="none" stroke="#10b981" stroke-opacity="0.15" stroke-width="26"/>
    <circle cx="256" cy="275" r="145" fill="none" stroke="#06b6d4" stroke-opacity="0.3" stroke-width="3" stroke-dasharray="16 12"/>
    <path d="M 256 102 L 138 376 C 134 385 140 396 150 396 L 194 396 C 201 396 207 392 210 385 L 256 270 L 256 102 Z" fill="#10b981"/>
    <path d="M 256 102 L 256 270 L 302 385 C 305 392 311 396 318 396 L 362 396 C 372 396 378 385 374 376 L 256 102 Z" fill="#06b6d4"/>
    <path d="M 188 332 L 256 264 L 324 332 L 298 348 L 256 306 L 214 348 Z" fill="#6ee7b7"/>
    <path d="M 256 80 L 264 100 L 284 108 L 264 116 L 256 136 L 248 116 L 228 108 L 248 100 Z" fill="#ffffff"/>
  </g>

  <!-- Typography under Logo -->
  <text x="${width/2}" y="${height/2 + 256*logoScale + 48}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="${Math.max(22, Math.round(width * 0.055))}" fill="#ffffff" letter-spacing="1">
    AURA FINANZAS
  </text>
  <text x="${width/2}" y="${height/2 + 256*logoScale + 76}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="${Math.max(12, Math.round(width * 0.028))}" fill="#34d399">
    CONTROL OFFLINE &amp; FACTURAS
  </text>
</svg>
`;
}

async function run() {
  console.log('Generando iconos y assets de marca para Aura Finanzas...');

  // Save public SVGs
  fs.mkdirSync('public', { recursive: true });
  fs.mkdirSync('src/assets', { recursive: true });
  fs.writeFileSync('public/logo.svg', fullIconSvg);
  fs.writeFileSync('public/favicon.svg', fullIconSvg);
  fs.writeFileSync('src/assets/logo.svg', fullIconSvg);

  // Generate web PNGs
  await sharp(Buffer.from(fullIconSvg)).resize(512, 512).png().toFile('public/logo-512.png');
  await sharp(Buffer.from(fullIconSvg)).resize(192, 192).png().toFile('public/logo-192.png');
  await sharp(Buffer.from(fullIconSvg)).resize(64, 64).png().toFile('public/favicon.png');

  // Android mipmap sizes:
  // mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192
  const mipmapSizes = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const m of mipmapSizes) {
    const targetDir = path.join('android/app/src/main/res', m.dir);
    if (!fs.existsSync(targetDir)) continue;

    // ic_launcher.png
    await sharp(Buffer.from(fullIconSvg))
      .resize(m.size, m.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(Buffer.from(roundIconSvg))
      .resize(m.size, m.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(Buffer.from(foregroundSvg))
      .resize(m.fgSize, m.fgSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Actualizado ${m.dir} (${m.size}x${m.size})`);
  }

  // Generate Splash Screens
  const splashTargets = [
    { file: 'android/app/src/main/res/drawable/splash.png', w: 480, h: 320 },
    { file: 'android/app/src/main/res/drawable-land-mdpi/splash.png', w: 480, h: 320 },
    { file: 'android/app/src/main/res/drawable-land-hdpi/splash.png', w: 800, h: 480 },
    { file: 'android/app/src/main/res/drawable-land-xhdpi/splash.png', w: 1280, h: 720 },
    { file: 'android/app/src/main/res/drawable-land-xxhdpi/splash.png', w: 1600, h: 960 },
    { file: 'android/app/src/main/res/drawable-land-xxxhdpi/splash.png', w: 1920, h: 1280 },
    { file: 'android/app/src/main/res/drawable-port-mdpi/splash.png', w: 320, h: 480 },
    { file: 'android/app/src/main/res/drawable-port-hdpi/splash.png', w: 480, h: 800 },
    { file: 'android/app/src/main/res/drawable-port-xhdpi/splash.png', w: 720, h: 1280 },
    { file: 'android/app/src/main/res/drawable-port-xxhdpi/splash.png', w: 960, h: 1600 },
    { file: 'android/app/src/main/res/drawable-port-xxxhdpi/splash.png', w: 1280, h: 1920 },
  ];

  for (const s of splashTargets) {
    if (fs.existsSync(path.dirname(s.file))) {
      const splashSvg = createSplashSvg(s.w, s.h);
      await sharp(Buffer.from(splashSvg))
        .resize(s.w, s.h)
        .png()
        .toFile(s.file);
      console.log(`Actualizado splash: ${s.file} (${s.w}x${s.h})`);
    }
  }

  console.log('¡Todos los logos y assets de Android generados con éxito!');
}

run().catch(console.error);
