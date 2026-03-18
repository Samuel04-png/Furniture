import { asset } from './content';
import type {
  AccountingRecord,
  Consultation,
  Enquiry,
  InventoryItem,
  ProductionOrder,
  VisualiserSession,
} from '../types';

export const initialVisualiserSessions: VisualiserSession[] = [
  {
    id: 'vis-001',
    roomPhotoUrl: asset('full bedroom setup/Tailored to reflect your style and provide the comfort you deserve. Transforming a house (1).jpg'),
    roomName: 'Editorial Lounge',

    placedItems: [
      {
        id: 'placed-1',
        productId: 'prod-zambezi-sofa',
        productName: 'The Zambezi Sofa',
        materialId: 'mukwa',
        x: 42,
        y: 70,
        scale: 1,
        rotation: 0,
        zIndex: 2,
      },
    ],
    submittedAt: '2026-03-16T08:45:00.000Z',
    status: 'New',
    clientName: 'Natasha M.',
    phone: '+260 977 345 612',
    email: 'natasha@example.com',
    assignedTo: 'team-amos',
  },
  {
    id: 'vis-002',
    roomPhotoUrl: asset('ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (5).jpg'),
    roomName: 'Private Study',

    placedItems: [
      {
        id: 'placed-2',
        productId: 'prod-copperbelt-desk',
        productName: 'Copperbelt Executive Desk',
        materialId: 'rosewood',
        x: 49,
        y: 64,
        scale: 0.92,
        rotation: 0,
        zIndex: 2,
      },
    ],
    submittedAt: '2026-03-15T11:15:00.000Z',
    status: 'Contacted',
    clientName: 'Tendai B.',
    phone: '+260 976 555 214',
    email: 'tendai@example.com',
    assignedTo: 'team-jane',
  },
];

export const initialEnquiries: Enquiry[] = [
  {
    id: 'enq-001',
    type: 'visualiser',
    clientName: 'Natasha M.',
    phone: '+260 977 345 612',
    email: 'natasha@example.com',
    productIds: ['prod-zambezi-sofa'],
    productNames: ['The Zambezi Sofa'],
    status: 'New',
    assignedTo: 'team-amos',
    channel: 'Visualiser',
    createdAt: '2026-03-16T08:50:00.000Z',
    notes: [
      {
        id: 'note-001',
        author: 'System',
        message: 'Visualiser submission captured with 1 placed item.',
        createdAt: '2026-03-16T08:50:00.000Z',
      },
    ],
    visualiserSessionId: 'vis-001',
    visualiserScreenshot: asset('full bedroom setup/Tailored to reflect your style and provide the comfort you deserve. Transforming a house (1).jpg'),
  },

  {
    id: 'enq-002',
    type: 'configurator',
    clientName: 'Lewis C.',
    phone: '+260 977 777 888',
    email: 'lewis@example.com',
    productIds: ['prod-mukwa-dining-table'],
    productNames: ['Mukwa Dining Table'],
    status: 'Quote Sent',
    assignedTo: 'team-mwila',
    channel: 'Configurator',
    createdAt: '2026-03-15T13:10:00.000Z',
    notes: [
      {
        id: 'note-002',
        author: 'Mwila Banda',
        message: 'Initial quote shared with two finish options and delivery estimate.',
        createdAt: '2026-03-15T15:45:00.000Z',
      },
    ],
    configurationData: {
      productId: 'prod-mukwa-dining-table',
      productName: 'Mukwa Dining Table',
      materialId: 'mukwa',
      finish: 'Medium Gloss',
      dimensions: { width: 300, depth: 110, height: 76 },
      quantity: 1,
      notes: 'Requested soft bullnose edge and matching bench.',
      sizeLabel: 'Custom',
    },
  },
  {
    id: 'enq-003',
    type: 'consultation',
    clientName: 'Mwaka N.',
    phone: '+260 966 112 345',
    email: 'mwaka@example.com',
    productIds: ['prod-luangwa-bed', 'prod-rosewood-credenza'],
    productNames: ['The Luangwa Bed', 'Rosewood Credenza'],
    status: 'Consultation Scheduled',
    assignedTo: 'team-jane',
    channel: 'Direct',
    createdAt: '2026-03-14T10:00:00.000Z',
    notes: [
      {
        id: 'note-003',
        author: 'Amos Phiri',
        message: 'Client requested bedroom mood board references before site visit.',
        createdAt: '2026-03-14T10:20:00.000Z',
      },
    ],
    preferredContactTime: 'Late afternoon',
  },
];

export const initialConsultations: Consultation[] = [
  {
    id: 'con-001',
    enquiryId: 'enq-003',
    clientName: 'Mwaka N.',
    phone: '+260 966 112 345',
    email: 'mwaka@example.com',
    scheduledAt: '2026-03-17T13:30:00.000Z',
    assignedDesigner: 'team-jane',
    status: 'Scheduled',
    source: 'consultation',
    notes: 'Site visit and wardrobe wall discussion.',
  },
  {
    id: 'con-002',
    enquiryId: 'enq-002',
    clientName: 'Lewis C.',
    phone: '+260 977 777 888',
    email: 'lewis@example.com',
    scheduledAt: '2026-03-18T09:00:00.000Z',
    assignedDesigner: 'team-mwila',
    status: 'Scheduled',
    source: 'configurator',
    notes: 'Dining table finish approval.',
  },
];

export const initialProductionOrders: ProductionOrder[] = [
  {
    id: 'ord-001',
    consultationId: 'con-002',
    clientName: 'Lewis C.',
    productId: 'prod-mukwa-dining-table',
    productName: 'Mukwa Dining Table',
    configuration: '300 x 110 x 76 cm, Medium Gloss, Mukwa',
    material: 'Mukwa',
    deadline: '2026-04-15',
    craftsman: 'Kelvin Zulu',
    status: 'In Production',
    depositPaid: 36000,
    balanceDue: 36000,
    progressPhotos: [
      asset('bedroomfurniture/Crafted with durable, quality wood and finished with care.#sikalehome #bedroom #craftsmanship (1).jpg'),
      asset('bedroomfurniture/Crafted with durable, quality wood and finished with care.#sikalehome #bedroom #craftsmanship (2).jpg')
    ],
  },

  {
    id: 'ord-002',
    consultationId: 'con-001',
    clientName: 'Mwaka N.',
    productId: 'prod-luangwa-bed',
    productName: 'The Luangwa Bed',
    configuration: 'King, Mahogany, Clay Velvet headboard',
    material: 'Mahogany',
    deadline: '2026-04-24',
    craftsman: 'Kelvin Zulu',
    status: 'Materials Sourced',
    depositPaid: 42000,
    balanceDue: 42500,
    progressPhotos: [asset('ideal dining table/Designed to bring warmth, style, and everyday elegance to your home. With the festive season he (2).jpg')],
  },

];

export const initialInventory: InventoryItem[] = [
  { id: 'inv-001', name: 'Mukwa Boards', category: 'Hardwood', unit: 'm3', onHand: 6.4, reserved: 3.1, reorderPoint: 2.5, supplier: 'Lusaka Timber Co.', eta: '2026-03-22' },
  { id: 'inv-002', name: 'Rosewood Boards', category: 'Hardwood', unit: 'm3', onHand: 2.1, reserved: 1.4, reorderPoint: 1.5, supplier: 'Copper Forest Supply', eta: '2026-03-28' },
  { id: 'inv-003', name: 'Performance Linen Rolls', category: 'Fabric', unit: 'rolls', onHand: 11, reserved: 4, reorderPoint: 5, supplier: 'Studio Textiles', eta: '2026-03-20' },
  { id: 'inv-004', name: 'Soft Close Hardware Sets', category: 'Hardware', unit: 'sets', onHand: 32, reserved: 14, reorderPoint: 10, supplier: 'Precision Joinery Supply', eta: '2026-03-21' },
  { id: 'inv-005', name: 'Hardwax Oil', category: 'Finishing', unit: 'litres', onHand: 18, reserved: 6, reorderPoint: 8, supplier: 'Finish House', eta: '2026-03-19' },
];

export const initialAccounting: AccountingRecord[] = [
  {
    id: 'acc-001',
    type: 'Invoice',
    title: 'Kabulonga Residence final invoice',
    clientName: 'Natasha M.',
    amount: 148000,
    status: 'Issued',
    dueDate: '2026-03-28',
    issuedDate: '2026-03-12',
  },
  {
    id: 'acc-002',
    type: 'Deposit',
    title: 'Leopards Hill Dining Suite deposit',
    clientName: 'Lewis C.',
    amount: 36000,
    status: 'Paid',
    dueDate: '2026-03-08',
    issuedDate: '2026-03-05',
  },
  {
    id: 'acc-003',
    type: 'Expense',
    title: 'Rosewood procurement batch',
    amount: 28500,
    status: 'Paid',
    dueDate: '2026-03-10',
    issuedDate: '2026-03-10',
  },
  {
    id: 'acc-004',
    type: 'Purchase Order',
    title: 'Performance linen reorder',
    amount: 9400,
    status: 'Draft',
    dueDate: '2026-03-18',
    issuedDate: '2026-03-16',
  },
];
