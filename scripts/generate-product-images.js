// Generate beautiful SVG product placeholder images for Bakery by the Bay
const fs = require('fs');
const path = require('path');

const products = [
  {
    file: 'cupcakes.svg',
    name: 'Cupcakes',
    price: '0.00',
    gradient: ['#E8C9C0', '#D4A898'],
    icon: 'M300,340 C300,340 200,340 200,280 C200,220 240,200 260,200 C260,200 270,170 300,170 C330,170 340,200 340,200 C360,200 400,220 400,280 C400,340 300,340 300,340 Z M250,280 Q300,300 350,280'
  },
  {
    file: 'fruit-cream-tarts.svg',
    name: 'Fruit\nTarts',
    price: '5.00',
    gradient: ['#C8D6C5', '#A8BCA0'],
    icon: 'M200,280 L250,220 L350,220 L400,280 Z M220,270 C220,290 380,290 380,270 M240,270 Q260,260 280,270 M320,270 Q340,260 360,270 M270,230 C270,240 280,250 300,250 C320,250 330,240 330,230'
  },
  {
    file: 'fruit-pies.svg',
    name: 'Fruit\nPies',
    price: '25.00',
    gradient: ['#D4B896', '#C4A078'],
    icon: 'M190,290 C190,350 410,350 410,290 C410,250 380,230 300,220 C220,230 190,250 190,290 Z M210,290 C210,280 240,250 300,245 C360,250 390,280 390,290'
  },
  {
    file: 'mini-cheesecakes.svg',
    name: 'Mini\nCheesecakes',
    price: '5.00',
    gradient: ['#E8D5C4', '#DDBFA8'],
    icon: 'M260,200 L340,200 L350,280 L250,280 Z M240,280 L360,280 L360,310 L240,310 Z M300,200 Q300,180 300,180 C280,180 270,190 270,200 M250,280 Q300,300 350,280'
  },
  {
    file: 'muffins.svg',
    name: 'Muffins',
    price: '7.00',
    gradient: ['#C4A88C', '#B09070'],
    icon: 'M250,260 C250,260 230,260 230,220 C230,180 260,160 300,160 C340,160 370,180 370,220 C370,260 350,260 350,260 Z M250,260 L250,290 L350,290 L350,260 M270,290 L270,310 L330,310 L330,290'
  },
  {
    file: 'pecan-cream-pies.svg',
    name: 'Pecan &\nCream Pies',
    price: '30.00',
    gradient: ['#B0A090', '#9A8A78'],
    icon: 'M190,280 C190,340 410,340 410,280 C410,240 380,220 300,210 C220,220 190,240 190,280 Z M220,280 C220,260 260,240 300,240 C340,240 380,260 380,280 M240,270 Q260,260 280,270 Q300,280 320,270 Q340,260 360,270'
  },
  {
    file: 'scones.svg',
    name: 'Scones',
    price: '5.25',
    gradient: ['#D4C4B0', '#C8B498'],
    icon: 'M240,260 C240,220 260,200 300,200 C340,200 360,220 360,260 L360,290 L240,290 Z M260,260 C260,240 270,225 300,225 C330,225 340,240 340,260 M280,260 L280,200 M320,260 L320,200'
  },
  {
    file: 'squares.svg',
    name: 'Squares',
    price: '0.00',
    gradient: ['#C8BFA0', '#B8AD88'],
    icon: 'M220,210 L380,210 L380,300 L220,300 Z M240,210 L240,300 M260,210 L260,300 M280,210 L280,300 M300,210 L300,300 M320,210 L320,300 M340,210 L340,300 M360,210 L360,300 M220,240 L380,240 M220,270 L380,270'
  }
];

const outputDir = path.join(__dirname, '..', 'assets', 'images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

for (const product of products) {
  const [c1, c2] = product.gradient;
  const lines = product.name.split('\n');

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="600" height="450" fill="url(#bg)"/>

  <!-- Subtle grain texture -->
  <rect width="600" height="450" fill="url(#glow)"/>

  <!-- Decorative circles -->
  <circle cx="300" cy="220" r="120" fill="rgba(255,255,255,0.12)"/>
  <circle cx="300" cy="220" r="80" fill="rgba(255,255,255,0.08)"/>

  <!-- Decorative top corner -->
  <circle cx="500" cy="-50" r="200" fill="rgba(255,255,255,0.06)"/>
  <circle cx="100" cy="500" r="150" fill="rgba(255,255,255,0.05)"/>

  <!-- Product icon -->
  <g transform="translate(300, 215)" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    ${product.icon.split('\n').map(line => `<path d="${line.trim()}"/>`).join('\n    ')}
  </g>

  <!-- Separator -->
  <line x1="230" y1="320" x2="370" y2="320" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

  <!-- Product name -->
  <text x="300" y="355" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="300" font-size="${lines.length > 1 ? '28' : '32'}" fill="rgba(255,255,255,0.85)" letter-spacing="0.02em">
    <tspan x="300" dy="0">${lines[0]}</tspan>
    ${lines.length > 1 ? `<tspan x="300" dy="34">${lines[1]}</tspan>` : ''}
  </text>

  <!-- Price -->
  <text x="300" y="398" text-anchor="middle" font-family="'Helvetica Neue', Arial, sans-serif" font-weight="300" font-size="16" fill="rgba(255,255,255,0.55)" letter-spacing="0.05em">$${product.price}</text>
</svg>`;

  const filePath = path.join(outputDir, product.file);
  fs.writeFileSync(filePath, svg);
  console.log(`✓ Generated ${product.file}`);
}

console.log(`\n✅ All ${products.length} product images generated in ${outputDir}`);
