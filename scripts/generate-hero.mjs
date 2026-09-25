// Regenerates public/hero.png (1200x630 OG) and public/splash.png (400x400)
// in the dark "onchain reward layer" theme. Run: node scripts/generate-hero.mjs
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = join(__dirname, "..", "public");

const BG = "#0A0A0F";
const ACCENT = "#00E5A0";
const TEXT = "#F5F5F7";
const DIM = "#8A8A9A";

const hero = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="glow" cx="80%" cy="15%" r="60%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="${BG}"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- wordmark -->
  <g transform="translate(80,84)">
    <rect width="34" height="34" rx="10" fill="${ACCENT}"/>
    <path d="M13 7 C13 4, 21 4, 21 7 C22 14, 22 22, 17 28 C12 22, 12 14, 13 7 Z" fill="${BG}"/>
    <text x="48" y="26" font-family="'Space Grotesk','Arial'" font-size="26" font-weight="700" fill="${TEXT}">basedrop</text>
  </g>

  <!-- agent-callable pill -->
  <g transform="translate(80,150)">
    <rect width="250" height="42" rx="21" fill="none" stroke="${ACCENT}" stroke-opacity="0.5"/>
    <text x="24" y="27" font-family="'Space Grotesk','Arial'" font-size="17" font-weight="600" fill="${ACCENT}">🤖 Agent-callable · MCP</text>
  </g>

  <!-- headline -->
  <text x="80" y="290" font-family="'Space Grotesk','Arial'" font-size="58" font-weight="700" fill="${TEXT}" letter-spacing="-2">USDC rewards, distributed</text>
  <text x="80" y="360" font-family="'Space Grotesk','Arial'" font-size="58" font-weight="700" letter-spacing="-2"><tspan fill="${TEXT}">by anyone — </tspan><tspan fill="${ACCENT}">human or agent.</tspan></text>

  <!-- hero number -->
  <line x1="80" y1="470" x2="1120" y2="470" stroke="${TEXT}" stroke-opacity="0.08"/>
  <text x="80" y="450" font-family="'Space Grotesk','Arial'" font-size="30" font-weight="600" fill="${DIM}" letter-spacing="2">THE ONCHAIN REWARD LAYER FOR BASE</text>
  <text x="80" y="560" font-family="'Space Grotesk','Arial'" font-size="34" font-weight="600" fill="${DIM}">Create a drop · claim USDC · zero platform fees</text>
</svg>`;

const splash = `
<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${BG}"/>
  <g transform="translate(150,140)">
    <rect width="100" height="100" rx="28" fill="${ACCENT}"/>
    <path d="M38 22 C38 12, 62 12, 62 22 C64 44, 64 66, 50 82 C36 66, 36 44, 38 22 Z" fill="${BG}"/>
  </g>
  <text x="200" y="300" text-anchor="middle" font-family="'Space Grotesk','Arial'" font-size="34" font-weight="700" fill="${TEXT}">basedrop</text>
</svg>`;

await sharp(Buffer.from(hero)).png().toFile(join(pub, "hero.png"));
await sharp(Buffer.from(splash)).png().toFile(join(pub, "splash.png"));
console.log("✅ hero.png + splash.png regenerated (dark theme)");
