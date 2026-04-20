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
export type ProductVisibility = 'public' | 'showroom' | 'internal';
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
export type QuoteStatus = 'Draft' | 'Requested' | 'Sent' | 'Negotiation' | 'Won' | 'Lost';
export type ProductionStage =
  | 'Confirmed Order'
  | 'Materials Sourced'
  | 'In Production'
  | 'Quality Check'
  | 'Ready for Delivery'
  | 'Delivered';
export type TeamRole =
  | 'Owner'
  | 'Admin'
  | 'Sales'
  | 'Designer'
  | 'Production Manager'
  | 'Inventory Manager'
  | 'Procurement'
  | 'Accountant'
  | 'Read Only'
  | 'Operations'
  | 'Workshop'
  | 'Production'
  | 'Inventory';
export type TeamStatus = 'Invited' | 'Active' | 'Disabled';
export type AccountingType = 'Invoice' | 'Expense' | 'Deposit' | 'Purchase Order';
export type AccountingStatus = 'Draft' | 'Issued' | 'Paid' | 'Overdue';
export type AutomationStatus = 'Active' | 'Paused' | 'Draft';
export type AdminWorkspaceKey =
  | 'command-center'
  | 'pipeline'
  | 'jobs'
  | 'materials'
  | 'finance'
  | 'products'
  | 'system';
export type AutomationEventType =
  | 'lead.created'
  | 'lead.consultation_scheduled'
  | 'lead.quote_sent'
  | 'consultation.scheduled'
  | 'finance.overdue'
  | 'inventory.low_stock'
  | 'job.stage_changed';
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'danger';
export type OverlayKind =
  | 'sofa'
  | 'table'
  | 'chair'
  | 'cabinet'
  | 'bed'
  | 'desk'
  | 'outdoor';

export interface AuditFields {
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface DimensionSet {
  width: number;
  depth: number;
  height: number;
}

export interface Material extends AuditFields {
  id: string;
  name: string;
  type?: string;
  unit?: string;
  quantity?: number;
  reorderPoint?: number;
  supplier?: string;
  costPerUnit?: number;
  origin: string;
  description: string;
  character: string;
  bestFor: string[];
  grainImage: string;
  grainImagePath?: string | null;
  tone: string;
  accentTone: string;
  availableFinishes: string[];
  sortOrder?: number;
  publishedToWebsite?: boolean;
  visibleOnSite?: boolean;
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

export interface ProductWebsiteSettings {
  isPublished: boolean;
  visibility: ProductVisibility;
  featured: boolean;
  featuredOrder?: number;
  storeTitle?: string;
  storeSummary?: string;
  storeDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: string | null;
  publishedBy?: string | null;
}

export interface Product extends AuditFields {
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
  publishedToWebsite?: boolean;
  website?: ProductWebsiteSettings;
  internalNotes?: string;
}

export interface PublishedProduct extends Product {
  website: ProductWebsiteSettings & {
    isPublished: true;
    visibility: 'public';
  };
}

export interface ProductMedia extends AuditFields {
  id: string;
  productId: string;
  kind: 'hero' | 'card' | 'gallery' | 'process';
  label?: string;
  path: string;
  url: string;
  order: number;
  contentType?: string;
  sizeBytes?: number;
}

export interface SampleRoom extends AuditFields {
  id: string;
  name: string;
  image: string;
  imagePath?: string | null;
  spaceType: RoomCategory;
  visibleOnSite?: boolean;
  sortOrder?: number;
}

export interface Testimonial extends AuditFields {
  id: string;
  quote: string;
  clientName: string;
  location: string;
  image: string;
  imagePath?: string | null;
  visibleOnSite?: boolean;
  sortOrder?: number;
}

export interface PortfolioProject extends AuditFields {
  id: string;
  slug: string;
  title: string;
  location: string;
  category: string;
  heroImage: string;
  heroImagePath?: string | null;
  gallery: string[];
  galleryPaths?: string[];
  summary: string;
  challenge: string;
  solution: string;
  materials: string[];
  metrics: string[];
  testimonial: string;
  publishedToWebsite?: boolean;
  visibleOnSite?: boolean;
  sortOrder?: number;
}

export interface TeamMember extends AuditFields {
  id: string;
  uid?: string;
  name: string;
  role: TeamRole;
  email: string;
  phone: string;
  initials: string;
  status?: TeamStatus;
  avatarUrl?: string;
  avatarPath?: string | null;
  bio?: string;
  active?: boolean;
  publicProfile?: boolean;
  isPublicProfile?: boolean;
  lastLoginAt?: string;
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
  customDesignImagePath?: string | null;
  customDesignNotes?: string;
  uploadedSpacePhoto?: string | null;
  uploadedSpacePhotoPath?: string | null;
  sizeLabel?: string;
  estimatedPrice?: number;
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
  roomPhotoPath?: string | null;
  roomName: string;
  items: PlacedVisualiserItem[];
  gridEnabled: boolean;
  zoom: number;
}

export interface VisualiserSession extends AuditFields {
  id: string;
  roomPhotoUrl: string;
  roomPhotoPath?: string | null;
  roomName: string;
  placedItems: PlacedVisualiserItem[];
  submittedAt: string;
  status: VisualiserSessionStatus;
  clientName?: string;
  phone?: string;
  email?: string;
  assignedTo?: string;
  enquiryId?: string;
}

export interface Enquiry extends AuditFields {
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
  sourceLabel?: string;
  createdAt: string;
  notes: EnquiryNote[];
  configuration?: ConfigurationData;
  configurationData?: ConfigurationData;
  visualiserSessionId?: string;
  visualiserScreenshot?: string;
  preferredContactTime?: string;
  read?: boolean;
}

export interface Consultation extends AuditFields {
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

export interface QuoteRecord extends AuditFields {
  id: string;
  leadId?: string;
  consultationId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  quoteNumber?: string;
  status: QuoteStatus;
  productIds: string[];
  productNames: string[];
  summary: string;
  amount?: number;
  notes?: string;
  validUntil?: string;
}

export interface ProductionOrder extends AuditFields {
  id: string;
  title?: string;
  consultationId?: string;
  clientName: string;
  productId: string;
  productName: string;
  configuration: string;
  material: string;
  deadline: string;
  deliveryDate?: string;
  craftsman: string;
  status: ProductionStage;
  depositPaid: number;
  balanceDue: number;
  dependencies?: string[];
  qcNotes?: string;
  progressPhotos: string[];
}

export interface InventoryItem extends AuditFields {
  id: string;
  name: string;
  category: 'Hardwood' | 'Fabric' | 'Hardware' | 'Finishing';
  unit: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  supplier: string;
  costPerUnit?: number;
  eta: string;
}

export interface InvoiceLineItem {
  id: string;
  inventoryItemId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface AccountingRecord extends AuditFields {
  id: string;
  type: AccountingType;
  title: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  amount: number;
  status: AccountingStatus;
  dueDate: string;
  issuedDate: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  lineItems?: InvoiceLineItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  feeAmount?: number;
  attachmentUrl?: string;
  attachmentPath?: string;
}

export interface NotificationTemplate extends AuditFields {
  id: string;
  label: string;
  body: string;
  category?: string;
  eventType?: AutomationEventType;
}

export interface AutomationRule extends AuditFields {
  id: string;
  title: string;
  detail: string;
  state: AutomationStatus;
  touchpoints: string[];
  eventType?: AutomationEventType;
  workspace?: AdminWorkspaceKey;
  templateId?: string | null;
  targetRoles?: TeamRole[];
  severity?: NotificationSeverity;
}

export interface NotificationRecord extends AuditFields {
  id: string;
  automationId?: string | null;
  automationTitle?: string | null;
  templateId?: string | null;
  eventType: AutomationEventType;
  workspace: AdminWorkspaceKey;
  relatedRecordId?: string | null;
  relatedPath?: string | null;
  title: string;
  body: string;
  severity: NotificationSeverity;
  targetRoles: TeamRole[];
  readBy: string[];
  triggeredAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export type WebsiteMediaSlot =
  | 'homeHeroPoster'
  | 'homeSignatureFeature'
  | 'aboutHero'
  | 'collectionsHero'
  | 'materialsHero'
  | 'contactHero'
  | 'bookConsultationHero'
  | 'theProcessHero'
  | 'configuratorHero'
  | 'configuratorConfirmationHero'
  | 'notFoundHero';

export interface WebsiteMediaItem extends AuditFields {
  slot: WebsiteMediaSlot;
  label: string;
  pagePath: string;
  image: string;
  imagePath?: string | null;
  alt: string;
  description: string;
  story: string;
}

export interface CompanySettings extends AuditFields {
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
  websiteMedia?: Partial<Record<WebsiteMediaSlot, WebsiteMediaItem>>;
}

export interface ConfiguratorDraft {
  productId?: string;
  isCustomDesign: boolean;
  customDesignImage: string | null;
  customDesignImagePath?: string | null;
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
  uploadedSpacePhotoPath?: string | null;
}
