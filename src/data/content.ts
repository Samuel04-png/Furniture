import type {
  CompanySettings,
  Material,
  PortfolioProject,
  Product,
  SampleRoom,
  TeamMember,
  Testimonial,
  UpholsterySwatch,
} from '../types';

const pexels = (id: number, width = 1600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;

const upholsterySwatches: UpholsterySwatch[] = [
  { id: 'saddle-leather', name: 'Saddle Leather', category: 'Leather', color: '#8B5E3C' },
  { id: 'sand-linen', name: 'Sand Linen', category: 'Linen', color: '#CBBDA5' },
  { id: 'clay-velvet', name: 'Clay Velvet', category: 'Velvet', color: '#A8684D' },
  { id: 'forest-performance', name: 'Forest Performance', category: 'Performance', color: '#55624C' },
  { id: 'charcoal-leather', name: 'Charcoal Leather', category: 'Leather', color: '#3F3A36' },
  { id: 'ivory-linen', name: 'Ivory Linen', category: 'Linen', color: '#E9E1D5' },
];

export const materials: Material[] = [
  {
    id: 'mukwa',
    name: 'Mukwa',
    origin: 'Zambian Savannah',
    description:
      'Deep amber tones, warm grain variation, and a luminous finish profile make Mukwa the signature Tailored Manor timber.',
    character:
      'Warm, optimistic, and highly architectural. Mukwa ages with grace and brings a naturally expensive glow to large statement pieces.',
    bestFor: ['Dining tables', 'Statement sofas', 'Bedroom suites'],
    grainImage: pexels(13570885, 900),
    tone: '#B37A42',
    accentTone: '#E8BB78',
    availableFinishes: ['Matt', 'Medium Gloss', 'High Gloss'],
  },
  {
    id: 'rosewood',
    name: 'Rosewood',
    origin: 'Southern Province',
    description:
      'Dense, dark, and dramatic. Rosewood carries visual depth even in low light and gives cabinetry a gallery-grade presence.',
    character:
      'Formal, rooted, and rich. Best used when a piece should feel like it belongs in the room for generations.',
    bestFor: ['Credenzas', 'Executive desks', 'Storage walls'],
    grainImage: pexels(34125692, 900),
    tone: '#5A2B28',
    accentTone: '#9A605B',
    availableFinishes: ['Matt', 'Medium Gloss', 'High Gloss'],
  },
  {
    id: 'teak',
    name: 'Teak',
    origin: 'Western Zambia',
    description:
      'Golden-brown with a clean linear grain and excellent resilience, ideal for quiet contemporary silhouettes.',
    character:
      'Relaxed and quietly premium. Teak is the material for restrained luxury and indoor-outdoor continuity.',
    bestFor: ['Outdoor seating', 'Minimal lounge chairs', 'Office pieces'],
    grainImage: pexels(36299690, 900),
    tone: '#9D7A45',
    accentTone: '#D6B276',
    availableFinishes: ['Matt', 'Medium Gloss'],
  },
  {
    id: 'mahogany',
    name: 'Mahogany',
    origin: 'Northern Forests',
    description:
      'Classic reddish undertones with exceptional carving quality. Mahogany gives tailored joinery and bed frames a timeless authority.',
    character:
      'Polished, classic, and deeply tactile. Ideal for heirloom pieces with refined detailing and sculpted edges.',
    bestFor: ['Beds', 'Dressers', 'Traditional dining'],
    grainImage: pexels(36495171, 900),
    tone: '#7B4A33',
    accentTone: '#C37A4A',
    availableFinishes: ['Matt', 'Medium Gloss', 'High Gloss'],
  },
];

export const products: Product[] = [
  {
    id: 'prod-zambezi-sofa',
    slug: 'zambezi-sofa',
    name: 'The Zambezi Sofa',
    category: 'Seating',
    room: 'Living',
    style: 'Contemporary',
    status: 'Live',
    materials: ['mukwa', 'rosewood', 'teak'],
    finishes: ['Matt', 'Medium Gloss', 'High Gloss'],
    upholsterySwatches,
    heroImage: pexels(7051278),
    cardImage: pexels(12513485, 1200),
    gallery: [pexels(7051278), pexels(12513485), pexels(276583), pexels(1571460)],
    summary: 'Low-slung seating with a hardwood frame that makes the room feel settled from the first glance.',
    story:
      'Designed for long evenings and layered conversation, the Zambezi Sofa balances a generous seat depth with a disciplined hardwood reveal. It is a living-room anchor built for homes that entertain beautifully.',
    description:
      'The frame is made to order in your chosen hardwood, with tailored upholstery and proportion adjustments available for formal lounges, open-plan family rooms, and apartment footprints alike.',
    dimensions: { width: 260, depth: 102, height: 78 },
    sizePresets: [
      { id: 'sofa-compact', label: 'Compact', dimensions: { width: 220, depth: 98, height: 78 } },
      { id: 'sofa-standard', label: 'Standard', dimensions: { width: 260, depth: 102, height: 78 } },
      { id: 'sofa-grand', label: 'Grand', dimensions: { width: 300, depth: 110, height: 78 } },
    ],
    customDimensions: true,
    priceFrom: 68000,
    leadTime: '6-8 weeks',
    tags: ['living room', 'upholstered', 'statement'],
    overlayKind: 'sofa',
    processGallery: [
      { title: 'Frame Joinery', caption: 'Mortise-and-tenon joints tuned to the final span and seating depth.', image: pexels(6790932) },
      { title: 'Hand Sanding', caption: 'Edges are broken by hand so the timber feels soft rather than sharp.', image: pexels(7482636) },
      { title: 'Finish Match', caption: 'The timber tone is balanced against your upholstery before final sealing.', image: pexels(5974351) },
    ],
  },
  {
    id: 'prod-mukwa-dining-table',
    slug: 'mukwa-dining-table',
    name: 'Mukwa Dining Table',
    category: 'Tables',
    room: 'Dining',
    style: 'Organic',
    status: 'Live',
    materials: ['mukwa', 'mahogany', 'rosewood'],
    finishes: ['Matt', 'Medium Gloss', 'High Gloss'],
    heroImage: pexels(5997993),
    cardImage: pexels(271816, 1200),
    gallery: [pexels(5997993), pexels(271816), pexels(1543441), pexels(4906504)],
    summary: 'A generous slab-style dining table shaped to feel ceremonial without becoming heavy.',
    story:
      'This dining table is cut to celebrate the timber first. The softened edge profile and sculpted base keep the scale confident but welcoming, allowing the grain to do most of the talking.',
    description:
      'Available as six-seater, eight-seater, or fully custom lengths with matching benches or dining chairs. Designed for family homes, boardroom dining, and entertaining-focused interiors.',
    dimensions: { width: 280, depth: 110, height: 76 },
    sizePresets: [
      { id: 'dining-6', label: '6 Seater', dimensions: { width: 220, depth: 100, height: 76 } },
      { id: 'dining-8', label: '8 Seater', dimensions: { width: 280, depth: 110, height: 76 } },
      { id: 'dining-10', label: '10 Seater', dimensions: { width: 340, depth: 115, height: 76 } },
    ],
    customDimensions: true,
    priceFrom: 72000,
    leadTime: '6-8 weeks',
    tags: ['dining', 'solid hardwood', 'family'],
    overlayKind: 'table',
    processGallery: [
      { title: 'Timber Selection', caption: 'Boards are selected for flow so the top reads as one continuous statement.', image: pexels(5710873) },
      { title: 'Base Fabrication', caption: 'The base is tuned to the top thickness and final room scale.', image: pexels(35919730) },
      { title: 'Final Oil', caption: 'Multiple coats enrich the warmth while preserving the tactile grain.', image: pexels(5974351) },
    ],
  },
  {
    id: 'prod-kalabo-lounge-chair',
    slug: 'kalabo-lounge-chair',
    name: 'Kalabo Lounge Chair',
    category: 'Seating',
    room: 'Living',
    style: 'Minimalist',
    status: 'Live',
    materials: ['teak', 'mukwa', 'mahogany'],
    finishes: ['Matt', 'Medium Gloss'],
    upholsterySwatches,
    heroImage: pexels(6489127),
    cardImage: pexels(1571460, 1200),
    gallery: [pexels(6489127), pexels(1571460), pexels(276583), pexels(271743)],
    summary: 'An exposed timber lounge chair with tailored upholstery and a quiet, gallery-like profile.',
    story:
      'The Kalabo Chair is defined by restraint: a slim timber frame, open sides, and a floating seat that lets the material read as architecture. It works alone or in pairs.',
    description:
      'Ideal for living rooms, reading corners, reception areas, and boutique hospitality settings. Available with softer lounge geometry or a more upright conversation posture.',
    dimensions: { width: 84, depth: 86, height: 79 },
    sizePresets: [
      { id: 'chair-standard', label: 'Standard', dimensions: { width: 84, depth: 86, height: 79 } },
      { id: 'chair-deep', label: 'Deep Lounge', dimensions: { width: 90, depth: 95, height: 79 } },
    ],
    customDimensions: true,
    priceFrom: 24500,
    leadTime: '5-7 weeks',
    tags: ['accent seating', 'pairing piece', 'reading chair'],
    overlayKind: 'chair',
    processGallery: [
      { title: 'Bent Profile', caption: 'Arm and back geometry are refined for visual lightness and comfort.', image: pexels(7482636) },
      { title: 'Seat Build', caption: 'Foam density and fabric direction are matched to the room use case.', image: pexels(8447892) },
      { title: 'Stain Control', caption: 'Every finish is sample matched before final upholstery installation.', image: pexels(5974351) },
    ],
  },
  {
    id: 'prod-rosewood-credenza',
    slug: 'rosewood-credenza',
    name: 'Rosewood Credenza',
    category: 'Storage',
    room: 'Living',
    style: 'Contemporary',
    status: 'Live',
    materials: ['rosewood', 'mahogany', 'mukwa'],
    finishes: ['Matt', 'Medium Gloss', 'High Gloss'],
    heroImage: pexels(3932930),
    cardImage: pexels(6489117, 1200),
    gallery: [pexels(3932930), pexels(6489117), pexels(32493215), pexels(6585758)],
    summary: 'A long-form storage piece for media rooms, dining rooms, and calm executive interiors.',
    story:
      'The Rosewood Credenza is built to hide the practical without feeling utilitarian. Push-to-open fronts and a sculpted plinth keep the form clean while the grain carries the richness.',
    description:
      'Configured with internal shelves, cable management, felt-lined drawers, and optional stone or timber tops for projects that need more architectural presence.',
    dimensions: { width: 220, depth: 52, height: 78 },
    sizePresets: [
      { id: 'credenza-standard', label: 'Standard', dimensions: { width: 220, depth: 52, height: 78 } },
      { id: 'credenza-wide', label: 'Wide', dimensions: { width: 280, depth: 52, height: 78 } },
    ],
    customDimensions: true,
    priceFrom: 51000,
    leadTime: '6-8 weeks',
    tags: ['storage', 'media unit', 'custom cabinetry'],
    overlayKind: 'cabinet',
    processGallery: [
      { title: 'Casework Build', caption: 'Panels are matched so grain direction reads uninterrupted across doors.', image: pexels(5710873) },
      { title: 'Hardware Setting', caption: 'Each hinge and runner is tuned for silent operation and even reveals.', image: pexels(35919730) },
      { title: 'Final Inspection', caption: 'The finish is checked under soft and direct light before dispatch.', image: pexels(6790932) },
    ],
  },
  {
    id: 'prod-luangwa-bed',
    slug: 'luangwa-bed',
    name: 'The Luangwa Bed',
    category: 'Beds',
    room: 'Bedroom',
    style: 'Traditional',
    status: 'Live',
    materials: ['mahogany', 'mukwa', 'rosewood'],
    finishes: ['Matt', 'Medium Gloss', 'High Gloss'],
    upholsterySwatches,
    heroImage: pexels(6186525),
    cardImage: pexels(279719, 1200),
    gallery: [pexels(6186525), pexels(279719), pexels(1643383), pexels(271743)],
    summary: 'An upholstered hardwood bed frame composed to feel calm, grounded, and unmistakably bespoke.',
    story:
      'The Luangwa Bed turns the bedroom into a retreat. The timber frame is proportioned to feel substantial without becoming bulky, while the headboard can be softened with leather, velvet, or linen.',
    description:
      'Configured for queen, king, super king, or full custom mattress sizes with integrated side shelves, under-bed drawers, or matching bedside tables.',
    dimensions: { width: 198, depth: 220, height: 112 },
    sizePresets: [
      { id: 'bed-queen', label: 'Queen', dimensions: { width: 175, depth: 220, height: 112 } },
      { id: 'bed-king', label: 'King', dimensions: { width: 198, depth: 220, height: 112 } },
      { id: 'bed-super-king', label: 'Super King', dimensions: { width: 228, depth: 230, height: 118 } },
    ],
    customDimensions: true,
    priceFrom: 84500,
    leadTime: '7-9 weeks',
    tags: ['bedroom', 'upholstered', 'heirloom'],
    overlayKind: 'bed',
    processGallery: [
      { title: 'Headboard Mockup', caption: 'Scale studies ensure the bed sits correctly beneath artwork and wall lighting.', image: pexels(8447892) },
      { title: 'Frame Assembly', caption: 'Load-bearing sections are reinforced for silent, long-term performance.', image: pexels(6790932) },
      { title: 'Fabric Upholstery', caption: 'Each upholstered panel is wrapped by hand for clean seams and soft edges.', image: pexels(7482636) },
    ],
  },
  {
    id: 'prod-copperbelt-desk',
    slug: 'copperbelt-executive-desk',
    name: 'Copperbelt Executive Desk',
    category: 'Office',
    room: 'Office',
    style: 'Minimalist',
    status: 'Live',
    materials: ['rosewood', 'teak', 'mukwa'],
    finishes: ['Matt', 'Medium Gloss'],
    heroImage: pexels(32493215),
    cardImage: pexels(3932930, 1200),
    gallery: [pexels(32493215), pexels(3932930), pexels(6489117), pexels(6585758)],
    summary: 'A quietly commanding desk with storage integrated into the massing rather than added as clutter.',
    story:
      'Created for founders, directors, and private studies, the Copperbelt Desk prioritises presence without showiness. Cable paths are concealed, storage is balanced, and the timber edge remains the focus.',
    description:
      'Specify return orientation, drawer stack, cable grommets, leather writing inlay, and paired credenza options for boardroom-grade home offices.',
    dimensions: { width: 200, depth: 85, height: 76 },
    sizePresets: [
      { id: 'desk-standard', label: 'Standard', dimensions: { width: 180, depth: 80, height: 76 } },
      { id: 'desk-executive', label: 'Executive', dimensions: { width: 220, depth: 90, height: 76 } },
    ],
    customDimensions: true,
    priceFrom: 58000,
    leadTime: '6-8 weeks',
    tags: ['study', 'executive', 'storage integrated'],
    overlayKind: 'desk',
    processGallery: [
      { title: 'Layout Drafting', caption: 'Power, storage, and seating clearances are mapped before cut lists are approved.', image: pexels(35919730) },
      { title: 'Drawer Detailing', caption: 'Desk drawers receive fine reveals and felt-lined internals where required.', image: pexels(5710873) },
      { title: 'Final Buff', caption: 'A satin finish gives the desk a refined glow without glare under task lighting.', image: pexels(5974351) },
    ],
  },
  {
    id: 'prod-kasama-console',
    slug: 'kasama-console',
    name: 'Kasama Console',
    category: 'Tables',
    room: 'Living',
    style: 'Organic',
    status: 'Live',
    materials: ['mukwa', 'mahogany', 'teak'],
    finishes: ['Matt', 'Medium Gloss', 'High Gloss'],
    heroImage: pexels(6585758),
    cardImage: pexels(271743, 1200),
    gallery: [pexels(6585758), pexels(271743), pexels(276583), pexels(1571460)],
    summary: 'A sculpted entry console that introduces the house with warmth, rhythm, and restraint.',
    story:
      'The Kasama Console is designed for transitional spaces: entrances, corridors, and behind-sofa zones. Its proportions are tuned to artwork, mirrors, and circulation rather than just storage.',
    description:
      'Available open, drawer-based, or with concealed storage doors. Ideal for styling with vessels, lighting, and collected objects.',
    dimensions: { width: 180, depth: 42, height: 84 },
    sizePresets: [
      { id: 'console-standard', label: 'Standard', dimensions: { width: 180, depth: 42, height: 84 } },
      { id: 'console-long', label: 'Long', dimensions: { width: 240, depth: 42, height: 84 } },
    ],
    customDimensions: true,
    priceFrom: 36000,
    leadTime: '5-7 weeks',
    tags: ['entry', 'corridor', 'statement'],
    overlayKind: 'table',
    processGallery: [
      { title: 'Edge Profile', caption: 'The profile is softened to read elegant from every angle in circulation spaces.', image: pexels(7482636) },
      { title: 'Shelf Setting', caption: 'Spacing is adapted to styling objects, books, or hidden baskets.', image: pexels(35919730) },
      { title: 'Tone Finish', caption: 'The finish is matched to the adjoining floor and wall palette.', image: pexels(5974351) },
    ],
  },
  {
    id: 'prod-savanna-outdoor-lounge',
    slug: 'savanna-outdoor-lounge',
    name: 'Savanna Outdoor Lounge',
    category: 'Outdoor',
    room: 'Outdoor',
    style: 'Organic',
    status: 'Live',
    materials: ['teak'],
    finishes: ['Matt'],
    upholsterySwatches: upholsterySwatches.filter((item) => item.category !== 'Velvet'),
    heroImage: pexels(6489127),
    cardImage: pexels(5997993, 1200),
    gallery: [pexels(6489127), pexels(5997993), pexels(12513485), pexels(271816)],
    summary: 'Modular outdoor seating built in teak for terraces, patios, and poolside lounges.',
    story:
      'The Savanna collection brings indoor levels of refinement outside. Thick teak members, outdoor-grade upholstery, and modular layouts create a hospitality-grade setup for private homes.',
    description:
      'Specify one, two, or three modules with corner units, coffee tables, and quick-dry outdoor cushions. Designed for Zambian sun and seasonal transitions.',
    dimensions: { width: 240, depth: 90, height: 74 },
    sizePresets: [
      { id: 'outdoor-2', label: '2 Module', dimensions: { width: 180, depth: 90, height: 74 } },
      { id: 'outdoor-3', label: '3 Module', dimensions: { width: 240, depth: 90, height: 74 } },
    ],
    customDimensions: true,
    priceFrom: 76000,
    leadTime: '6-8 weeks',
    tags: ['outdoor', 'modular', 'teak'],
    overlayKind: 'outdoor',
    processGallery: [
      { title: 'Teak Prep', caption: 'Boards are selected and sealed for outdoor stability and colour consistency.', image: pexels(5710873) },
      { title: 'Weather Detailing', caption: 'Joints and drainage allowances are tuned for exterior conditions.', image: pexels(6790932) },
      { title: 'Outdoor Upholstery', caption: 'Performance fabrics are paired with quick-dry foam inserts.', image: pexels(8447892) },
    ],
  },
];

export const featureProducts = ['zambezi-sofa', 'mukwa-dining-table', 'kalabo-lounge-chair', 'rosewood-credenza'];

export const sampleRooms: SampleRoom[] = [
  { id: 'room-lounge', name: 'Editorial Lounge', image: pexels(7051278), spaceType: 'Living' },
  { id: 'room-dining', name: 'Warm Dining Room', image: pexels(5997993), spaceType: 'Dining' },
  { id: 'room-study', name: 'Private Study', image: pexels(32493215), spaceType: 'Office' },
];

export const testimonials: Testimonial[] = [
  {
    id: 'test-1',
    quote:
      'The dining suite changed the rhythm of our home. It feels architecturally part of the room, not simply placed inside it.',
    clientName: 'Chanda',
    location: 'Kabulonga Residence',
    image: pexels(5997993),
  },
  {
    id: 'test-2',
    quote:
      'The visualiser gave us the confidence to commission a full lounge set. What arrived felt exactly right for the scale of the room.',
    clientName: 'Mwaka',
    location: 'Roma Townhouse',
    image: pexels(12513485),
  },
  {
    id: 'test-3',
    quote:
      'The desk feels like a proper piece of architecture. It brought focus and calm to the office immediately.',
    clientName: 'Tendai',
    location: 'Lusaka Studio Office',
    image: pexels(32493215),
  },
];

export const portfolioProjects: PortfolioProject[] = [
  {
    id: 'proj-kabulonga',
    slug: 'kabulonga-residence',
    title: 'Kabulonga Residence',
    location: 'Lusaka, Zambia',
    category: 'Whole-Home Furnishing',
    heroImage: pexels(12513485),
    gallery: [pexels(12513485), pexels(7051278), pexels(271743), pexels(1571460)],
    summary:
      'A family lounge and dining suite composed around a warm neutral palette, Mukwa joinery, and layered upholstery.',
    challenge:
      'The home had generous ceiling height but fragmented furniture zones. The brief required a calmer visual hierarchy without losing warmth.',
    solution:
      'We introduced a low, wide sofa composition, a long dining slab, and custom entry pieces that linked the rooms through consistent timber tone.',
    materials: ['mukwa', 'teak'],
    metrics: ['7 custom pieces', '8-week delivery', 'Full install and styling'],
    testimonial:
      'Tailored Manor made the space feel intentional from the first step through the front door.',
  },
  {
    id: 'proj-leopards-hill',
    slug: 'leopards-hill-dining-suite',
    title: 'Leopards Hill Dining Suite',
    location: 'Leopards Hill, Zambia',
    category: 'Dining + Entertaining',
    heroImage: pexels(5997993),
    gallery: [pexels(5997993), pexels(271816), pexels(1543441), pexels(4906504)],
    summary:
      'A large-format dining environment built for weekly hosting, with a table proportioned to anchor the entire open-plan room.',
    challenge:
      'The clients wanted seating for ten without the room feeling heavy or overfurnished.',
    solution:
      'A sculpted base and softened slab edge reduced visual mass while preserving the full entertaining capacity.',
    materials: ['mukwa', 'mahogany'],
    metrics: ['10-seater table', 'Matching console', 'Integrated service storage'],
    testimonial:
      'It is the first thing people notice, and the one thing everyone asks about before dinner starts.',
  },
  {
    id: 'proj-roma-study',
    slug: 'roma-study-retreat',
    title: 'Roma Study Retreat',
    location: 'Roma, Lusaka',
    category: 'Executive Home Office',
    heroImage: pexels(32493215),
    gallery: [pexels(32493215), pexels(3932930), pexels(6489117), pexels(6585758)],
    summary:
      'A private study designed around a custom desk, storage credenza, and warm ambient lighting.',
    challenge:
      'The room needed to feel authoritative for client calls and calm enough for deep focused work.',
    solution:
      'Rosewood and teak were combined to balance richness with brightness, while the storage wall concealed office clutter completely.',
    materials: ['rosewood', 'teak'],
    metrics: ['2-zone workspace', 'Cable-managed desk', 'Acoustic styling'],
    testimonial:
      'The room became calmer, sharper, and more productive the day it was installed.',
  },
  {
    id: 'proj-siavonga',
    slug: 'siavonga-patio-lounge',
    title: 'Siavonga Patio Lounge',
    location: 'Siavonga, Zambia',
    category: 'Outdoor Living',
    heroImage: pexels(6489127),
    gallery: [pexels(6489127), pexels(5997993), pexels(12513485), pexels(271816)],
    summary:
      'An outdoor teak lounge designed to mirror the refinement of the interior while withstanding full sun exposure.',
    challenge:
      'The client wanted true hospitality-level comfort outside without heavy commercial furniture language.',
    solution:
      'We created a modular teak arrangement with performance upholstery and a stone-accent coffee table.',
    materials: ['teak'],
    metrics: ['3-module lounge', 'Outdoor coffee table', 'Quick-dry cushions'],
    testimonial:
      'It feels like a boutique resort, but it still belongs naturally to our home.',
  },
];

export const teamMembers: TeamMember[] = [
  { id: 'team-jane', name: 'Jane Doe', role: 'Owner', email: 'jane@tailoredmanor.com', phone: '+260 977 000 111', initials: 'JD' },
  { id: 'team-mwila', name: 'Mwila Banda', role: 'Designer', email: 'mwila@tailoredmanor.com', phone: '+260 977 000 112', initials: 'MB' },
  { id: 'team-amos', name: 'Amos Phiri', role: 'Sales', email: 'amos@tailoredmanor.com', phone: '+260 977 000 113', initials: 'AP' },
  { id: 'team-kelvin', name: 'Kelvin Zulu', role: 'Workshop', email: 'kelvin@tailoredmanor.com', phone: '+260 977 000 114', initials: 'KZ' },
];

export const companySettings: CompanySettings = {
  companyName: 'Tailored Manor',
  address: 'Twin Palms Road, Lusaka, Zambia',
  primaryPhone: '+260 981 504 322',
  secondaryPhone: '+260 977 000 111',
  email: 'hello@tailoredmanor.com',
  whatsappNumber: '260981504322',
  socialHandles: {
    instagram: '@tailoredmanor',
    facebook: 'Tailored Manor Zambia',
  },
  showroomHours: [
    { day: 'Monday', hours: '09:00 - 17:00' },
    { day: 'Tuesday', hours: '09:00 - 17:00' },
    { day: 'Wednesday', hours: '09:00 - 17:00' },
    { day: 'Thursday', hours: '09:00 - 17:00' },
    { day: 'Friday', hours: '09:00 - 17:00' },
    { day: 'Saturday', hours: '10:00 - 15:00' },
    { day: 'Sunday', hours: 'By appointment' },
  ],
  defaultLeadTimes: {
    Seating: '6-8 weeks',
    Tables: '6-8 weeks',
    Storage: '6-8 weeks',
    Beds: '7-9 weeks',
    Office: '6-8 weeks',
    Outdoor: '6-8 weeks',
  },
  notificationTemplates: [
    {
      id: 'template-consult-reminder',
      label: 'Consultation reminder',
      body: 'Hello {{name}}, this is a reminder of your Tailored Manor consultation scheduled for {{date}} at {{time}}.',
    },
    {
      id: 'template-quote-confirmation',
      label: 'Quote confirmation',
      body: 'Hello {{name}}, we have received your quote request for {{piece}}. Our team will contact you within 24 hours.',
    },
    {
      id: 'template-ready-delivery',
      label: 'Ready for delivery',
      body: 'Hello {{name}}, your {{piece}} is ready for delivery. Our team will contact you to confirm installation timing.',
    },
  ],
};

export const adminCredentials = {
  email: 'owner@tailoredmanor.com',
  password: 'tailored2026',
};

export const navLinks = [
  { label: 'Collections', href: '/collections' },
  { label: 'The Process', href: '/the-process' },
  { label: 'Our Work', href: '/portfolio' },
  { label: 'Contact', href: '/contact' },
];
