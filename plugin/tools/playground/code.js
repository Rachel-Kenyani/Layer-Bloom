// One-off helper: builds a deliberately messy landing page to use as the Layer Bloom playground file.
// Run once in an empty Figma file: Plugins → Development → Import plugin from manifest → choose this folder's manifest.json.

const BURGUNDY = { r: 0.42, g: 0.06, b: 0.21 };
const INK = { r: 0.12, g: 0.1, b: 0.12 };
const MUTED = { r: 0.45, g: 0.42, b: 0.44 };
const LIGHT = { r: 0.97, g: 0.95, b: 0.96 };
const WHITE = { r: 1, g: 1, b: 1 };
const PINK = { r: 0.89, g: 0.63, b: 0.75 };
const EMERALD = { r: 0.07, g: 0.58, b: 0.42 };
const BLUSH = { r: 0.99, g: 0.93, b: 0.96 };
const MINT = { r: 0.89, g: 0.96, b: 0.92 };
const DEEP = { r: 0.17, g: 0.03, b: 0.09 };

let counter = 1;
const genericName = (type) => `${type} ${counter++}`;
const solid = (color) => [{ type: 'SOLID', color }];
const gradient = (from, to) => [
  {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [1, 0, 0],
      [0, 1, 0],
    ],
    gradientStops: [
      { position: 0, color: { ...from, a: 1 } },
      { position: 1, color: { ...to, a: 1 } },
    ],
  },
];

function frame(
  children,
  { direction = 'VERTICAL', gap = 16, padding = 0, fill = null, fills = null, radius = 0, width = null, align = 'MIN' } = {},
) {
  const node = figma.createFrame();
  node.name = genericName('Frame');
  node.layoutMode = direction;
  node.itemSpacing = gap;
  node.paddingTop = node.paddingBottom = node.paddingLeft = node.paddingRight = padding;
  node.counterAxisAlignItems = align;
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = width ? 'FIXED' : 'AUTO';
  if (width) {
    node.resize(width, 100);
  }
  node.fills = fills ?? (fill ? solid(fill) : []);
  node.cornerRadius = radius;
  for (const child of children) {
    node.appendChild(child);
  }
  return node;
}

/** Groups children laid out in a row. Positions are set before grouping, because a group takes its children's positions. */
function group(children, gap = 0) {
  let x = 0;
  for (const child of children) {
    figma.currentPage.appendChild(child);
    child.x = x;
    child.y = 0;
    x += child.width + gap;
  }
  const node = figma.group(children, figma.currentPage);
  node.name = genericName('Group');
  return node;
}

function text(characters, { size = 16, weight = 'Regular', color = INK, width = null } = {}) {
  const node = figma.createText();
  node.fontName = { family: 'Inter', style: weight };
  node.characters = characters;
  node.fontSize = size;
  node.fills = solid(color);
  if (width) {
    node.textAutoResize = 'HEIGHT';
    node.resize(width, node.height);
  }
  return node;
}

function shape(kind, width, height, color, radius = 0) {
  const node = kind === 'ellipse' ? figma.createEllipse() : figma.createRectangle();
  node.name = genericName(kind === 'ellipse' ? 'Ellipse' : 'Rectangle');
  node.resize(width, height);
  node.fills = solid(color);
  if (kind !== 'ellipse') {
    node.cornerRadius = radius;
  }
  return node;
}

function icon(color) {
  const node = figma.createVector();
  node.name = 'Vector';
  node.vectorPaths = [
    { windingRule: 'NONZERO', data: 'M 12 2 L 15 9 L 22 9 L 16.5 13.5 L 18.5 21 L 12 16.5 L 5.5 21 L 7.5 13.5 L 2 9 L 9 9 Z' },
  ];
  node.fills = solid(color);
  return node;
}

function button(label, filled) {
  return frame([text(label, { size: 16, weight: 'Semi Bold', color: filled ? WHITE : BURGUNDY })], {
    direction: 'HORIZONTAL',
    padding: 14,
    fill: filled ? BURGUNDY : LIGHT,
    radius: 10,
  });
}

function featureCard(title, body) {
  return frame(
    [
      frame([icon(BURGUNDY)], { padding: 12, fill: LIGHT, radius: 12 }),
      text(title, { size: 20, weight: 'Semi Bold' }),
      text(body, { color: MUTED, width: 320 }),
    ],
    {
      padding: 28,
      fill: WHITE,
      radius: 18,
      width: 376,
    },
  );
}

function testimonial(quote, person, role) {
  return frame(
    [
      text(`“${quote}”`, { size: 18, width: 520 }),
      frame(
        [
          shape('ellipse', 44, 44, PINK),
          frame([text(person, { weight: 'Semi Bold' }), text(role, { size: 14, color: MUTED })], { gap: 2 }),
        ],
        { direction: 'HORIZONTAL', gap: 12, align: 'CENTER' },
      ),
    ],
    { padding: 32, fill: WHITE, radius: 18, gap: 20 },
  );
}

function taskCard(title, color) {
  const avatars = frame([shape('ellipse', 20, 20, PINK), shape('ellipse', 20, 20, MINT)], { direction: 'HORIZONTAL', gap: 4 });
  return frame([shape('rect', 36, 6, color, 3), text(title, { size: 14, weight: 'Semi Bold' }), avatars], {
    padding: 14,
    gap: 10,
    fill: WHITE,
    radius: 12,
    width: 150,
  });
}

function boardColumn(title, cards) {
  return frame([text(title, { size: 13, weight: 'Semi Bold', color: MUTED }), ...cards], { gap: 10 });
}

/** A mock task board, so the hero has a real visual to name. */
function heroBoard() {
  return frame(
    [
      boardColumn('To do', [taskCard('Draft launch email', PINK), taskCard('Book venue', EMERALD)]),
      boardColumn('In progress', [taskCard('Pricing page', BURGUNDY), taskCard('User interviews', PINK)]),
      boardColumn('Done', [taskCard('Brand colours', EMERALD)]),
    ],
    { direction: 'HORIZONTAL', gap: 14, padding: 24, fills: gradient(BLUSH, MINT), radius: 24 },
  );
}

function instructions() {
  const card = frame(
    [
      text('Try Layer Bloom here', { size: 28, weight: 'Bold', color: BURGUNDY }),
      text(
        '1. Select the "Frame" next to this card (the messy landing page).\n2. Run Plugins → Layer Bloom.\n3. Choose your AI provider and paste your own API key.\n4. Scan, then "Suggest names with AI".\n5. Review the names, click any to see it on the canvas, then Rename.\n\nEvery layer in the page is badly named on purpose — open the Layers panel before and after.\nOne Cmd+Z (Ctrl+Z) undoes the whole rename.',
        { size: 18, width: 460 },
      ),
    ],
    { padding: 40, fill: LIGHT, radius: 24, gap: 20 },
  );
  card.name = 'How to Try Layer Bloom';
  for (const child of card.children) {
    child.name = child.characters.split('\n')[0];
  }
  return card;
}

async function build() {
  await Promise.all(['Regular', 'Semi Bold', 'Bold'].map((style) => figma.loadFontAsync({ family: 'Inter', style })));

  const navLinks = group([text('Home'), text('Pricing'), text('About'), text('Blog')], 36);
  const nav = frame(
    [
      frame([shape('rect', 32, 32, BURGUNDY, 8), text('Petalboard', { size: 22, weight: 'Bold' })], {
        direction: 'HORIZONTAL',
        gap: 10,
        align: 'CENTER',
      }),
      navLinks,
      button('Sign up', true),
    ],
    {
      direction: 'HORIZONTAL',
      gap: 340,
      align: 'CENTER',
    },
  );

  const hero = frame(
    [
      frame(
        [
          text('Plan your team’s week in minutes', { size: 56, weight: 'Bold', width: 560 }),
          text('Drag tasks onto a shared board, see who’s free, and ship on time. No spreadsheets.', {
            size: 20,
            color: MUTED,
            width: 520,
          }),
          frame([button('Start free trial', true), button('Watch demo', false)], { direction: 'HORIZONTAL', gap: 12 }),
          frame([icon(EMERALD), text('Trusted by 4,000+ teams', { size: 14, color: MUTED })], {
            direction: 'HORIZONTAL',
            gap: 8,
            align: 'CENTER',
          }),
        ],
        { gap: 24 },
      ),
      heroBoard(),
    ],
    { direction: 'HORIZONTAL', gap: 64, align: 'CENTER', padding: 56, fills: gradient(BLUSH, WHITE), radius: 32 },
  );

  const logos = frame(
    ['Northwind', 'Acme', 'Globex', 'Initech', 'Umbrella'].map((name) => text(name, { size: 22, weight: 'Bold', color: MUTED })),
    { direction: 'HORIZONTAL', gap: 96, padding: 28 },
  );

  const features = frame(
    [
      text('Everything your team needs', { size: 40, weight: 'Bold' }),
      frame(
        [
          featureCard('Shared boards', 'Everyone sees the same plan, updated live.'),
          featureCard('Smart scheduling', 'Spot clashes and free time before they become problems.'),
          featureCard('Weekly reports', 'A one-page summary lands in your inbox every Friday.'),
        ],
        { direction: 'HORIZONTAL', gap: 24 },
      ),
    ],
    { gap: 32, align: 'CENTER', padding: 56, fill: LIGHT, radius: 32 },
  );

  const testimonials = frame(
    [
      testimonial('We stopped losing tasks between meetings. The Friday report alone is worth it.', 'Amara Okafor', 'Head of Ops, Globex'),
      testimonial('Onboarding took one afternoon. The team actually enjoys planning now.', 'Daniel Mwangi', 'Product Lead, Initech'),
    ],
    { direction: 'HORIZONTAL', gap: 24 },
  );

  const footer = frame(
    [
      text('© 2026 Petalboard', { size: 14, color: PINK }),
      group([text('Privacy', { size: 14, color: WHITE }), text('Terms', { size: 14, color: WHITE })], 32),
    ],
    { direction: 'HORIZONTAL', gap: 960, align: 'CENTER', padding: 32, fill: DEEP, radius: 24 },
  );

  const page = frame([nav, hero, logos, features, testimonials, footer], {
    padding: 80,
    gap: 96,
    fill: { r: 0.99, g: 0.98, b: 0.98 },
    width: 1440,
    align: 'CENTER',
  });
  page.x = 0;
  page.y = 0;

  const card = instructions();
  card.x = -620;
  card.y = 0;

  figma.currentPage.name = 'Playground';
  figma.currentPage.selection = [page];
  figma.viewport.scrollAndZoomIntoView([card, page]);
  figma.closePlugin(`Built a messy page with ${counter - 1} generic names. Now run Layer Bloom on it!`);
}

build().catch((error) => figma.closePlugin(`Couldn't build the playground: ${error.message}`));
