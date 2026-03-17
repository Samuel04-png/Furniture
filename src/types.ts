export type RoomCategory = 'Living' | 'Dining' | 'Bedroom' | 'Office' | 'Outdoor';
export type ProductCategory =
  | 'Seating'
  | 'Tables'
  | 'Storage'
  | 'Beds'
  | 'Office'
  | 'Outdoor';
export type StyleMood = 'Contemporary' | 'Traditional' | 'Organic' | 'Minimalist';
export type ProductStatus = 'Live' | 'Draft' | 'Hidden';
export type EnquirySource = 'visualiser' | 'configurator' | 'consultation' | 'direct';
export type EnquiryStatus =
  | 'New'
  | 'Consultation Scheduled'
  | 'Quote Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost';
export type VisualiserSessionStatus = 'New' | 'Contacted' | 'Consultation Booked' | 'Closed';
export type ConsultationStatus = 'Scheduled' | 'Completed' | 'Rescheduled' | 'Cancelled';
export type ProductionStage =
  | 'Confirmed Order'
  | 'Materials Sourced'
  | 'In Production'
  | 'Quality Check'
  | 'Ready for Delivery'
  | 'Delivered';
export type TeamRole = 'Owner' | 'Designer' | 'Sales' | 'Workshop';
export type AccountingType = 'Invoice' | 'Expense' | 'Deposit' | 'Purchase Order';
export type AccountingStatus = 'Draft' | 'Issued' | 'Paid' | 'Overdue';
export type OverlayKind =
  | 'sofa'
  | 'table'
  | 'chair'
  | 'cabinet'
  | 'bed'
  | 'desk'
  | 'outdoor';

export interface DimensionSet {
  width: number;
  depth: number;
  height: number;
}

export interface Material {
  id: string;
  name: string;
  origin: string;
  description: string;
  character: string;
  bestFor: string[];
  grainImage: string;
  tone: string;
  accentTone: string;
  availableFinishes: string[];
}

export interface UpholsterySwatch {
  id: string;
  name: string;
  category: 'Leather' | 'Linen' | 'Velvet' | 'Performance';
  color: string;
}

export interface ProcessImage {
  title: string;
  caption: string;
  image: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  room: RoomCategory;
  style: StyleMood;
  status: ProductStatus;
  materials: string[];
  finishes: string[];
  upholsterySwatches?: UpholsterySwatch[];
  heroImage: string;
  cardImage: string;
  gallery: string[];
  summary: string;
  story: string;
  description: string;
  dimensions: DimensionSet;
  sizePresets: Array<{
    id: string;
    label: string;
    dimensions: DimensionSet;
  }>;
  customDimensions: boolean;
  priceFrom: number;
  leadTime: string;
  tags: string[];
  overlayKind: OverlayKind;
  silhouetteTone?: string;
  processGallery: ProcessImage[];
}

export interface SampleRoom {
  id: string;
  name: string;
  image: string;
  spaceType: RoomCategory;
}

export interface Testimonial {
  id: string;
  quote: string;
  clientName: string;
  location: string;
  image: string;
}

export interface PortfolioProject {
  id: string;
  slug: string;
  title: string;
  location: string;
  category: string;
  heroImage: string;
  gallery: string[];
  summary: string;
  challenge: string;
  solution: string;
  materials: string[];
  metrics: string[];
  testimonial: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  email: string;
  phone: string;
  initials: string;
}

export interface EnquiryNote {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface ConfigurationData {
  productId?: string;
  productName: string;
  materialId?: string;
  finish?: string;
  upholsteryId?: string;
  dimensions: DimensionSet;
  quantity: number;
  roomDimensions?: {
    width: number;
    length: number;
  };
  notes?: string;
  customDesignImage?: string | null;
  customDesignNotes?: string;
  uploadedSpacePhoto?: string | null;
  sizeLabel?: string;
}

export interface PlacedVisualiserItem {
  id: string;
  productId: string;
  productName: string;
  materialId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface VisualiserDraft {
  roomPhotoUrl: string | null;
  roomName: string;
  items: PlacedVisualiserItem[];
  gridEnabled: boolean;
  zoom: number;
}

export interface VisualiserSession {
  id: string;
  roomPhotoUrl: string;
  roomName: string;
  placedItems: PlacedVisualiserItem[];
  submittedAt: string;
  status: VisualiserSessionStatus;
  clientName?: string;
  phone?: string;
  email?: string;
  assignedTo?: string;
}

export interface Enquiry {
  id: string;
  type: EnquirySource;
  clientName: string;
  phone: string;
  email: string;
  productIds: string[];
  productNames: string[];
  status: EnquiryStatus;
  assignedTo?: string;
  channel: string;
  createdAt: string;
  notes: EnquiryNote[];
  configurationData?: ConfigurationData;
  visualiserSessionId?: string;
  visualiserScreenshot?: string;
  preferredContactTime?: string;
}

export interface Consultation {
  id: string;
  enquiryId?: string;
  clientName: string;
  phone: string;
  email: string;
  scheduledAt: string;
  assignedDesigner: string;
  status: ConsultationStatus;
  source: EnquirySource;
  notes: string;
  visualiserSessionId?: string;
}

export interface ProductionOrder {
  id: string;
  consultationId?: string;
  clientName: string;
  productId: string;
  productName: string;
  configuration: string;
  material: string;
  deadline: string;
  craftsman: string;
  status: ProductionStage;
  depositPaid: number;
  balanceDue: number;
  progressPhotos: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Hardwood' | 'Fabric' | 'Hardware' | 'Finishing';
  unit: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  supplier: string;
  eta: string;
}

export interface AccountingRecord {
  id: string;
  type: AccountingType;
  title: string;
  clientName?: string;
  amount: number;
  status: AccountingStatus;
  dueDate: string;
  issuedDate: string;
}

export interface NotificationTemplate {
  id: string;
  label: string;
  body: string;
}

export interface CompanySettings {
  companyName: string;
  address: string;
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  whatsappNumber: string;
  socialHandles: {
    instagram: string;
    facebook: string;
  };
  showroomHours: Array<{
    day: string;
    hours: string;
  }>;
  defaultLeadTimes: Record<ProductCategory, string>;
  notificationTemplates: NotificationTemplate[];
}

export interface ConfiguratorDraft {
  productId?: string;
  isCustomDesign: boolean;
  customDesignImage: string | null;
  customDesignNotes: string;
  materialId?: string;
  finish?: string;
  upholsteryId?: string;
  dimensionMode: 'standard' | 'custom';
  sizePresetId?: string;
  dimensions: DimensionSet;
  quantity: number;
  roomDimensions?: {
    width: number;
    length: number;
  };
  notes: string;
  clientName: string;
  phone: string;
  email: string;
  preferredContactTime: string;
  uploadedSpacePhoto: string | null;
}
