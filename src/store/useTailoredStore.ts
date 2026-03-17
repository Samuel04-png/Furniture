import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminCredentials, companySettings, materials, products, sampleRooms, teamMembers, testimonials, portfolioProjects } from '../data/content';
import {
  initialAccounting,
  initialConsultations,
  initialEnquiries,
  initialInventory,
  initialProductionOrders,
  initialVisualiserSessions,
} from '../data/adminSeed';
import { dimensionsLabel, generateId } from '../lib/utils';
import type {
  AccountingRecord,
  CompanySettings,
  ConfiguratorDraft,
  Consultation,
  Enquiry,
  Material,
  PlacedVisualiserItem,
  Product,
  ProductionOrder,
  ProductionStage,
  TeamMember,
  VisualiserDraft,
  VisualiserSession,
  VisualiserSessionStatus,
  InventoryItem,
} from '../types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const defaultVisualiserDraft: VisualiserDraft = {
  roomPhotoUrl: null,
  roomName: '',
  items: [],
  gridEnabled: false,
  zoom: 1,
};

const defaultConfiguratorDraft: ConfiguratorDraft = {
  isCustomDesign: false,
  customDesignImage: null,
  customDesignNotes: '',
  dimensionMode: 'standard',
  dimensions: { width: 220, depth: 100, height: 76 },
  quantity: 1,
  notes: '',
  clientName: '',
  phone: '',
  email: '',
  preferredContactTime: '',
  uploadedSpacePhoto: null,
};

interface VisualiserSubmissionPayload {
  clientName: string;
  phone: string;
  email: string;
  preferredDateTime?: string;
  notes?: string;
}

interface ConsultationRequestPayload {
  clientName: string;
  phone: string;
  email: string;
  preferredDateTime: string;
  notes: string;
  productIds?: string[];
  productNames?: string[];
  source: Enquiry['type'];
}

interface QuoteRequestPayload {
  preferredDateTime?: string;
}

interface TailoredStore {
  isAdminAuthenticated: boolean;
  products: Product[];
  materials: Material[];
  sampleRooms: typeof sampleRooms;
  testimonials: typeof testimonials;
  portfolioProjects: typeof portfolioProjects;
  teamMembers: TeamMember[];
  companySettings: CompanySettings;
  enquiries: Enquiry[];
  visualiserSessions: VisualiserSession[];
  consultations: Consultation[];
  productionOrders: ProductionOrder[];
  inventoryItems: InventoryItem[];
  accountingRecords: AccountingRecord[];
  visualiserDraft: VisualiserDraft;
  configuratorDraft: ConfiguratorDraft;
  loginAdmin: (email: string, password: string) => boolean;
  logoutAdmin: () => void;
  updateProduct: (productId: string, patch: Partial<Product>) => void;
  updateMaterial: (materialId: string, patch: Partial<Material>) => void;
  updateCompanySettings: (patch: Partial<CompanySettings>) => void;
  setVisualiserDraft: (patch: Partial<VisualiserDraft>) => void;
  resetVisualiserDraft: () => void;
  addPlacedItem: (item: PlacedVisualiserItem) => void;
  updatePlacedItem: (itemId: string, patch: Partial<PlacedVisualiserItem>) => void;
  removePlacedItem: (itemId: string) => void;
  clearPlacedItems: () => void;
  saveVisualiserDraftSession: () => string;
  loadVisualiserSession: (sessionId: string) => void;
  updateVisualiserSessionStatus: (sessionId: string, status: VisualiserSessionStatus) => void;
  createVisualiserSubmission: (payload: VisualiserSubmissionPayload) => { enquiryId: string; sessionId: string };
  setConfiguratorDraft: (patch: Partial<ConfiguratorDraft>) => void;
  resetConfiguratorDraft: () => void;
  createQuoteRequest: (payload?: QuoteRequestPayload) => { enquiryId: string };
  createConsultationRequest: (payload: ConsultationRequestPayload) => { enquiryId: string; consultationId: string };
  addEnquiry: (enquiry: Enquiry) => void;
  updateEnquiry: (enquiryId: string, patch: Partial<Enquiry>) => void;
  addEnquiryNote: (enquiryId: string, author: string, message: string) => void;
  assignEnquiry: (enquiryId: string, teamMemberId: string) => void;
  updateConsultation: (consultationId: string, patch: Partial<Consultation>) => void;
  moveProductionOrder: (orderId: string, status: ProductionStage) => void;
  updateInventoryItem: (inventoryId: string, patch: Partial<InventoryItem>) => void;
  addAccountingRecord: (record: AccountingRecord) => void;
  updateAccountingRecord: (recordId: string, patch: Partial<AccountingRecord>) => void;
}

export const productionStages: ProductionStage[] = [
  'Confirmed Order',
  'Materials Sourced',
  'In Production',
  'Quality Check',
  'Ready for Delivery',
  'Delivered',
];

const createInitialState = () => ({
  isAdminAuthenticated: false,
  products: clone(products),
  materials: clone(materials),
  sampleRooms,
  testimonials,
  portfolioProjects,
  teamMembers: clone(teamMembers),
  companySettings: clone(companySettings),
  enquiries: clone(initialEnquiries),
  visualiserSessions: clone(initialVisualiserSessions),
  consultations: clone(initialConsultations),
  productionOrders: clone(initialProductionOrders),
  inventoryItems: clone(initialInventory),
  accountingRecords: clone(initialAccounting),
  visualiserDraft: clone(defaultVisualiserDraft),
  configuratorDraft: clone(defaultConfiguratorDraft),
});

export const useTailoredStore = create<TailoredStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      loginAdmin: (email, password) => {
        const isValid =
          email.trim().toLowerCase() === adminCredentials.email &&
          password === adminCredentials.password;
        if (isValid) {
          set({ isAdminAuthenticated: true });
        }
        return isValid;
      },
      logoutAdmin: () => set({ isAdminAuthenticated: false }),
      updateProduct: (productId, patch) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === productId ? { ...product, ...patch } : product,
          ),
        })),
      updateMaterial: (materialId, patch) =>
        set((state) => ({
          materials: state.materials.map((material) =>
            material.id === materialId ? { ...material, ...patch } : material,
          ),
        })),
      updateCompanySettings: (patch) =>
        set((state) => ({
          companySettings: {
            ...state.companySettings,
            ...patch,
            socialHandles: {
              ...state.companySettings.socialHandles,
              ...patch.socialHandles,
            },
            defaultLeadTimes: {
              ...state.companySettings.defaultLeadTimes,
              ...patch.defaultLeadTimes,
            },
          },
        })),
      setVisualiserDraft: (patch) =>
        set((state) => ({
          visualiserDraft: {
            ...state.visualiserDraft,
            ...patch,
          },
        })),
      resetVisualiserDraft: () => set({ visualiserDraft: clone(defaultVisualiserDraft) }),
      addPlacedItem: (item) =>
        set((state) => ({
          visualiserDraft: {
            ...state.visualiserDraft,
            items: [...state.visualiserDraft.items, item],
          },
        })),
      updatePlacedItem: (itemId, patch) =>
        set((state) => ({
          visualiserDraft: {
            ...state.visualiserDraft,
            items: state.visualiserDraft.items.map((item) =>
              item.id === itemId ? { ...item, ...patch } : item,
            ),
          },
        })),
      removePlacedItem: (itemId) =>
        set((state) => ({
          visualiserDraft: {
            ...state.visualiserDraft,
            items: state.visualiserDraft.items.filter((item) => item.id !== itemId),
          },
        })),
      clearPlacedItems: () =>
        set((state) => ({
          visualiserDraft: {
            ...state.visualiserDraft,
            items: [],
          },
        })),
      saveVisualiserDraftSession: () => {
        const state = get();
        if (!state.visualiserDraft.roomPhotoUrl) {
          throw new Error('A room image is required before saving.');
        }
        const sessionId = generateId('vis');
        const session: VisualiserSession = {
          id: sessionId,
          roomPhotoUrl: state.visualiserDraft.roomPhotoUrl,
          roomName: state.visualiserDraft.roomName || 'Saved room',
          placedItems: clone(state.visualiserDraft.items),
          submittedAt: new Date().toISOString(),
          status: 'New',
        };
        set((current) => ({
          visualiserSessions: [session, ...current.visualiserSessions],
        }));
        return sessionId;
      },
      loadVisualiserSession: (sessionId) => {
        const session = get().visualiserSessions.find((item) => item.id === sessionId);
        if (!session) {
          return;
        }
        set({
          visualiserDraft: {
            roomPhotoUrl: session.roomPhotoUrl,
            roomName: session.roomName,
            items: clone(session.placedItems),
            gridEnabled: true,
            zoom: 1,
          },
        });
      },
      updateVisualiserSessionStatus: (sessionId, status) =>
        set((state) => ({
          visualiserSessions: state.visualiserSessions.map((session) =>
            session.id === sessionId ? { ...session, status } : session,
          ),
        })),
      createVisualiserSubmission: (payload) => {
        const state = get();
        if (!state.visualiserDraft.roomPhotoUrl) {
          throw new Error('A room photo is required before submitting the visualiser.');
        }

        const sessionId = generateId('vis');
        const enquiryId = generateId('enq');
        const session: VisualiserSession = {
          id: sessionId,
          roomPhotoUrl: state.visualiserDraft.roomPhotoUrl,
          roomName: state.visualiserDraft.roomName || 'Custom room upload',
          placedItems: clone(state.visualiserDraft.items),
          submittedAt: new Date().toISOString(),
          status: payload.preferredDateTime ? 'Consultation Booked' : 'New',
          clientName: payload.clientName,
          phone: payload.phone,
          email: payload.email,
        };
        const productIds = [...new Set(session.placedItems.map((item) => item.productId))];
        const productNames = [...new Set(session.placedItems.map((item) => item.productName))];
        const enquiry: Enquiry = {
          id: enquiryId,
          type: 'visualiser',
          clientName: payload.clientName,
          phone: payload.phone,
          email: payload.email,
          productIds,
          productNames,
          status: payload.preferredDateTime ? 'Consultation Scheduled' : 'New',
          assignedTo: 'team-amos',
          channel: 'Visualiser',
          createdAt: new Date().toISOString(),
          notes: [
            {
              id: generateId('note'),
              author: 'System',
              message: payload.notes || `Visualiser arrangement submitted with ${session.placedItems.length} pieces.`,
              createdAt: new Date().toISOString(),
            },
          ],
          visualiserSessionId: sessionId,
          visualiserScreenshot: session.roomPhotoUrl,
        };

        let consultation: Consultation | undefined;
        if (payload.preferredDateTime) {
          consultation = {
            id: generateId('con'),
            enquiryId,
            clientName: payload.clientName,
            phone: payload.phone,
            email: payload.email,
            scheduledAt: payload.preferredDateTime,
            assignedDesigner: 'team-mwila',
            status: 'Scheduled',
            source: 'visualiser',
            notes: payload.notes || '',
            visualiserSessionId: sessionId,
          };
        }

        set((current) => ({
          visualiserSessions: [session, ...current.visualiserSessions],
          enquiries: [enquiry, ...current.enquiries],
          consultations: consultation ? [consultation, ...current.consultations] : current.consultations,
          visualiserDraft: clone(defaultVisualiserDraft),
        }));

        return { enquiryId, sessionId };
      },
      setConfiguratorDraft: (patch) =>
        set((state) => ({
          configuratorDraft: {
            ...state.configuratorDraft,
            ...patch,
            dimensions: patch.dimensions
              ? { ...patch.dimensions }
              : state.configuratorDraft.dimensions,
            roomDimensions: patch.roomDimensions ?? state.configuratorDraft.roomDimensions,
          },
        })),
      resetConfiguratorDraft: () => set({ configuratorDraft: clone(defaultConfiguratorDraft) }),
      createQuoteRequest: (payload) => {
        const state = get();
        const selectedProduct = state.products.find((product) => product.id === state.configuratorDraft.productId);
        const enquiryId = generateId('enq');
        const configurationData = {
          productId: selectedProduct?.id,
          productName: selectedProduct?.name || 'Custom Design',
          materialId: state.configuratorDraft.materialId,
          finish: state.configuratorDraft.finish,
          upholsteryId: state.configuratorDraft.upholsteryId,
          dimensions: state.configuratorDraft.dimensions,
          quantity: state.configuratorDraft.quantity,
          roomDimensions: state.configuratorDraft.roomDimensions,
          notes: state.configuratorDraft.notes,
          customDesignImage: state.configuratorDraft.customDesignImage,
          customDesignNotes: state.configuratorDraft.customDesignNotes,
          uploadedSpacePhoto: state.configuratorDraft.uploadedSpacePhoto,
          sizeLabel: state.configuratorDraft.sizePresetId || state.configuratorDraft.dimensionMode,
        };

        const enquiry: Enquiry = {
          id: enquiryId,
          type: 'configurator',
          clientName: state.configuratorDraft.clientName,
          phone: state.configuratorDraft.phone,
          email: state.configuratorDraft.email,
          productIds: selectedProduct ? [selectedProduct.id] : [],
          productNames: [configurationData.productName],
          status: payload?.preferredDateTime ? 'Consultation Scheduled' : 'New',
          assignedTo: 'team-mwila',
          channel: 'Configurator',
          createdAt: new Date().toISOString(),
          preferredContactTime: state.configuratorDraft.preferredContactTime,
          notes: [
            {
              id: generateId('note'),
              author: 'System',
              message: `Quote request created for ${configurationData.productName}.`,
              createdAt: new Date().toISOString(),
            },
          ],
          configurationData,
        };

        const consultation: Consultation | undefined =
          payload?.preferredDateTime
            ? {
                id: generateId('con'),
                enquiryId,
                clientName: state.configuratorDraft.clientName,
                phone: state.configuratorDraft.phone,
                email: state.configuratorDraft.email,
                scheduledAt: payload.preferredDateTime,
                assignedDesigner: 'team-jane',
                status: 'Scheduled',
                source: 'configurator' as const,
                notes: state.configuratorDraft.notes,
              }
            : undefined;

        set((current) => ({
          enquiries: [enquiry, ...current.enquiries],
          consultations: consultation ? [consultation, ...current.consultations] : current.consultations,
          configuratorDraft: clone(defaultConfiguratorDraft),
        }));

        return { enquiryId };
      },
      createConsultationRequest: (payload) => {
        const enquiryId = generateId('enq');
        const consultationId = generateId('con');
        const enquiry: Enquiry = {
          id: enquiryId,
          type: payload.source,
          clientName: payload.clientName,
          phone: payload.phone,
          email: payload.email,
          productIds: payload.productIds ?? [],
          productNames: payload.productNames ?? [],
          status: 'Consultation Scheduled',
          assignedTo: 'team-amos',
          channel: payload.source === 'consultation' ? 'Consultation Form' : payload.source,
          createdAt: new Date().toISOString(),
          preferredContactTime: payload.preferredDateTime,
          notes: [
            {
              id: generateId('note'),
              author: 'System',
              message: payload.notes || 'Consultation request received.',
              createdAt: new Date().toISOString(),
            },
          ],
        };
        const consultation: Consultation = {
          id: consultationId,
          enquiryId,
          clientName: payload.clientName,
          phone: payload.phone,
          email: payload.email,
          scheduledAt: payload.preferredDateTime,
          assignedDesigner: 'team-jane',
          status: 'Scheduled',
          source: payload.source,
          notes: payload.notes,
        };
        set((state) => ({
          enquiries: [enquiry, ...state.enquiries],
          consultations: [consultation, ...state.consultations],
        }));
        return { enquiryId, consultationId };
      },
      addEnquiry: (enquiry) => set((state) => ({ enquiries: [enquiry, ...state.enquiries] })),
      updateEnquiry: (enquiryId, patch) =>
        set((state) => ({
          enquiries: state.enquiries.map((enquiry) =>
            enquiry.id === enquiryId ? { ...enquiry, ...patch } : enquiry,
          ),
        })),
      addEnquiryNote: (enquiryId, author, message) =>
        set((state) => ({
          enquiries: state.enquiries.map((enquiry) =>
            enquiry.id === enquiryId
              ? {
                  ...enquiry,
                  notes: [
                    ...enquiry.notes,
                    {
                      id: generateId('note'),
                      author,
                      message,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : enquiry,
          ),
        })),
      assignEnquiry: (enquiryId, teamMemberId) =>
        set((state) => ({
          enquiries: state.enquiries.map((enquiry) =>
            enquiry.id === enquiryId ? { ...enquiry, assignedTo: teamMemberId } : enquiry,
          ),
        })),
      updateConsultation: (consultationId, patch) =>
        set((state) => ({
          consultations: state.consultations.map((consultation) =>
            consultation.id === consultationId ? { ...consultation, ...patch } : consultation,
          ),
        })),
      moveProductionOrder: (orderId, status) =>
        set((state) => ({
          productionOrders: state.productionOrders.map((order) =>
            order.id === orderId ? { ...order, status } : order,
          ),
        })),
      updateInventoryItem: (inventoryId, patch) =>
        set((state) => ({
          inventoryItems: state.inventoryItems.map((item) =>
            item.id === inventoryId ? { ...item, ...patch } : item,
          ),
        })),
      addAccountingRecord: (record) =>
        set((state) => ({ accountingRecords: [record, ...state.accountingRecords] })),
      updateAccountingRecord: (recordId, patch) =>
        set((state) => ({
          accountingRecords: state.accountingRecords.map((record) =>
            record.id === recordId ? { ...record, ...patch } : record,
          ),
        })),
    }),
    {
      name: 'tailored-manor-store',
      partialize: (state) => ({
        isAdminAuthenticated: state.isAdminAuthenticated,
        products: state.products,
        materials: state.materials,
        teamMembers: state.teamMembers,
        companySettings: state.companySettings,
        enquiries: state.enquiries,
        visualiserSessions: state.visualiserSessions,
        consultations: state.consultations,
        productionOrders: state.productionOrders,
        inventoryItems: state.inventoryItems,
        accountingRecords: state.accountingRecords,
        visualiserDraft: state.visualiserDraft,
        configuratorDraft: state.configuratorDraft,
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<TailoredStore>),
      }),
    },
  ),
);

export function buildConfigurationSummary(productName: string, material: string, dimensions: { width: number; depth: number; height: number }) {
  return `${productName} in ${material}, ${dimensionsLabel(dimensions)}`;
}
