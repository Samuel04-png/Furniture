import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createTeamMember as createTeamMemberRemote,
  disableTeamMember as disableTeamMemberRemote,
  type CreateTeamMemberPayload,
  type CreateTeamMemberResult,
  subscribeTeamMembers,
  updateTeamMember as updateTeamMemberRemote,
} from '../lib/backend/repositories/team';
import {
  createProduct as createProductRemote,
  deleteProduct as deleteProductRemote,
  subscribeAdminProducts,
  updateProduct as updateProductRemote,
} from '../lib/backend/repositories/products';
import {
  createPortfolioProject as createPortfolioProjectRemote,
  createMaterial as createMaterialRemote,
  createSampleRoom as createSampleRoomRemote,
  createTestimonial as createTestimonialRemote,
  deletePortfolioProject as deletePortfolioProjectRemote,
  deleteMaterial as deleteMaterialRemote,
  deleteSampleRoom as deleteSampleRoomRemote,
  deleteTestimonial as deleteTestimonialRemote,
  fetchCompanySettings,
  subscribeAdminMaterials,
  subscribeAdminPortfolioProjects,
  subscribeAdminSampleRooms,
  subscribeAdminTestimonials,
  subscribeCompanySettings,
  subscribeMaterials,
  subscribePortfolioProjects,
  subscribePublicTeamProfiles,
  subscribePublishedProducts,
  subscribeSampleRooms,
  subscribeTestimonials,
  updatePortfolioProject as updatePortfolioProjectRemote,
  updateMaterial as updateMaterialRemote,
  updateSampleRoom as updateSampleRoomRemote,
  updateTestimonial as updateTestimonialRemote,
} from '../lib/backend/repositories/publicContent';
import {
  addEnquiryNote as addEnquiryNoteRemote,
  createConsultation as createConsultationRemote,
  createConsultationRequest as createConsultationRequestRemote,
  createEnquiry as createEnquiryRemote,
  createQuote as createQuoteRemote,
  createQuoteRequest as createQuoteRequestRemote,
  createVisualiserSubmission as createVisualiserSubmissionRemote,
  deleteConsultation as deleteConsultationRemote,
  deleteEnquiry as deleteEnquiryRemote,
  deleteQuote as deleteQuoteRemote,
  deleteVisualiserSession as deleteVisualiserSessionRemote,
  subscribeConsultations,
  subscribeEnquiries,
  subscribeQuotes,
  subscribeVisualiserSessions,
  updateConsultation as updateConsultationRemote,
  updateEnquiry as updateEnquiryRemote,
  updateQuote as updateQuoteRemote,
  updateVisualiserSessionStatus as updateVisualiserSessionStatusRemote,
} from '../lib/backend/repositories/crm';
import {
  createInventoryItem as createInventoryItemRemote,
  createProductionOrder as createProductionOrderRemote,
  createAccountingRecord as createAccountingRecordRemote,
  deleteAccountingRecord as deleteAccountingRecordRemote,
  deleteInventoryItem as deleteInventoryItemRemote,
  deleteProductionOrder as deleteProductionOrderRemote,
  moveProductionOrder as moveProductionOrderRemote,
  subscribeAccountingRecords,
  subscribeInventoryItems,
  subscribeProductionOrders,
  updateAccountingRecord as updateAccountingRecordRemote,
  updateInventoryItem as updateInventoryItemRemote,
  updateProductionOrder as updateProductionOrderRemote,
} from '../lib/backend/repositories/operations';
import {
  createTemplate as createTemplateRemote,
  createAutomation as createAutomationRemote,
  deleteAutomation as deleteAutomationRemote,
  deleteTemplate as deleteTemplateRemote,
  subscribeAdminCompanySettings,
  subscribeAutomations,
  subscribeTemplates,
  updateAutomation as updateAutomationRemote,
  updateCompanySettings as updateCompanySettingsRemote,
  updateTemplate as updateTemplateRemote,
} from '../lib/backend/repositories/settings';
import {
  markAllNotificationsRead as markAllNotificationsReadRemote,
  markNotificationRead as markNotificationReadRemote,
  subscribeNotifications,
} from '../lib/backend/repositories/notifications';
import {
  canAccessWorkspace,
  canOwnLeads,
  canTakeConsultations,
  getFirstAssignableTeamMemberId,
} from '../lib/adminAccess';
import { refreshAdminSession, signInAdmin as signInAdminRemote, signOutAdmin as signOutAdminRemote, watchAuthSession } from '../lib/backend/auth';
import { emptyCompanySettings } from '../lib/backend/constants';
import { uploadPublicSubmissionDataUrl } from '../lib/backend/services/storage';
import { dimensionsLabel, generateId } from '../lib/utils';
import type {
  AccountingRecord,
  AutomationRule,
  CompanySettings,
  ConfiguratorDraft,
  Consultation,
  Enquiry,
  InventoryItem,
  Material,
  NotificationRecord,
  NotificationTemplate,
  PortfolioProject,
  Product,
  ProductionOrder,
  ProductionStage,
  QuoteRecord,
  SampleRoom,
  TeamMember,
  Testimonial,
  PlacedVisualiserItem,
  VisualiserDraft,
  VisualiserSession,
  VisualiserSessionStatus,
} from '../types';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function getDefaultAssignments(teamMembers: TeamMember[]) {
  return {
    defaultOwner: getFirstAssignableTeamMemberId(teamMembers, canOwnLeads),
    defaultDesigner: getFirstAssignableTeamMemberId(teamMembers, canTakeConsultations),
  };
}

const defaultVisualiserDraft: VisualiserDraft = {
  roomPhotoUrl: null,
  roomPhotoPath: null,
  roomName: '',
  items: [],
  gridEnabled: false,
  zoom: 1,
};

const defaultConfiguratorDraft: ConfiguratorDraft = {
  isCustomDesign: false,
  customDesignImage: null,
  customDesignImagePath: null,
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
  uploadedSpacePhotoPath: null,
};

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

interface VisualiserSubmissionPayload {
  clientName: string;
  phone: string;
  email: string;
  preferredDateTime?: string;
  notes?: string;
}

interface AuthUserState {
  uid: string;
  email: string | null;
  role: TeamMember['role'];
}

interface TailoredStore {
  isAdminAuthenticated: boolean;
  authReady: boolean;
  authUser?: AuthUserState;
  activeAdminId?: string;
  products: Product[];
  adminProducts: Product[];
  materials: Material[];
  adminMaterials: Material[];
  sampleRooms: SampleRoom[];
  adminSampleRooms: SampleRoom[];
  testimonials: Testimonial[];
  adminTestimonials: Testimonial[];
  portfolioProjects: PortfolioProject[];
  adminPortfolioProjects: PortfolioProject[];
  publicTeamMembers: TeamMember[];
  teamMembers: TeamMember[];
  companySettings: CompanySettings;
  notificationTemplates: NotificationTemplate[];
  automationRules: AutomationRule[];
  notifications: NotificationRecord[];
  enquiries: Enquiry[];
  visualiserSessions: VisualiserSession[];
  consultations: Consultation[];
  quotes: QuoteRecord[];
  productionOrders: ProductionOrder[];
  inventoryItems: InventoryItem[];
  accountingRecords: AccountingRecord[];
  visualiserDraft: VisualiserDraft;
  configuratorDraft: ConfiguratorDraft;
  localVisualiserSessions: VisualiserSession[];
  productsLoaded: boolean;
  publicDataReady: boolean;
  adminDataReady: boolean;
  lastError?: string;
  loginAdmin: (email: string, password: string) => boolean;
  logoutAdmin: () => void;
  initAuth: () => void;
  signInAdmin: (email: string, password: string) => Promise<boolean>;
  setActiveAdmin: (adminId: string) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (productId: string, patch: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  loadProducts: () => Promise<void>;
  addMaterial: (material: Material) => Promise<void>;
  updateMaterial: (materialId: string, patch: Partial<Material>) => Promise<void>;
  deleteMaterial: (materialId: string) => Promise<void>;
  addSampleRoom: (room: SampleRoom) => Promise<void>;
  updateSampleRoom: (roomId: string, patch: Partial<SampleRoom>) => Promise<void>;
  deleteSampleRoom: (roomId: string) => Promise<void>;
  addTestimonial: (testimonial: Testimonial) => Promise<void>;
  updateTestimonial: (testimonialId: string, patch: Partial<Testimonial>) => Promise<void>;
  deleteTestimonial: (testimonialId: string) => Promise<void>;
  addPortfolioProject: (project: PortfolioProject) => Promise<void>;
  updatePortfolioProject: (projectId: string, patch: Partial<PortfolioProject>) => Promise<void>;
  deletePortfolioProject: (projectId: string) => Promise<void>;
  updateCompanySettings: (patch: Partial<CompanySettings>) => Promise<void>;
  addTeamMember: (payload: CreateTeamMemberPayload) => Promise<CreateTeamMemberResult | null>;
  updateTeamMember: (teamMemberId: string, patch: Partial<TeamMember>) => Promise<void>;
  disableTeamMember: (teamMemberId: string) => Promise<void>;
  addNotificationTemplate: (template: NotificationTemplate) => Promise<void>;
  updateNotificationTemplate: (templateId: string, patch: Partial<NotificationTemplate>) => Promise<void>;
  deleteNotificationTemplate: (templateId: string) => Promise<void>;
  addAutomationRule: (automation: AutomationRule) => Promise<void>;
  updateAutomationRule: (automationId: string, patch: Partial<AutomationRule>) => Promise<void>;
  deleteAutomationRule: (automationId: string) => Promise<void>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  setVisualiserDraft: (patch: Partial<VisualiserDraft>) => void;
  resetVisualiserDraft: () => void;
  addPlacedItem: (item: PlacedVisualiserItem) => void;
  updatePlacedItem: (itemId: string, patch: Partial<PlacedVisualiserItem>) => void;
  removePlacedItem: (itemId: string) => void;
  clearPlacedItems: () => void;
  saveVisualiserDraftSession: () => string;
  loadVisualiserSession: (sessionId: string) => void;
  updateVisualiserSessionStatus: (sessionId: string, status: VisualiserSessionStatus) => Promise<void>;
  createVisualiserSubmission: (payload: VisualiserSubmissionPayload) => Promise<{ enquiryId: string; sessionId: string }>;
  setConfiguratorDraft: (patch: Partial<ConfiguratorDraft>) => void;
  resetConfiguratorDraft: () => void;
  createQuoteRequest: (payload?: QuoteRequestPayload) => Promise<{ enquiryId: string }>;
  createConsultationRequest: (payload: ConsultationRequestPayload) => Promise<{ enquiryId: string; consultationId: string }>;
  addEnquiry: (enquiry: Enquiry) => Promise<void>;
  updateEnquiry: (enquiryId: string, patch: Partial<Enquiry>) => Promise<void>;
  deleteEnquiry: (enquiryId: string) => Promise<void>;
  addEnquiryNote: (enquiryId: string, author: string, message: string) => Promise<void>;
  assignEnquiry: (enquiryId: string, teamMemberId: string) => Promise<void>;
  addConsultation: (consultation: Consultation) => Promise<void>;
  updateConsultation: (consultationId: string, patch: Partial<Consultation>) => Promise<void>;
  deleteConsultation: (consultationId: string) => Promise<void>;
  addQuote: (quote: QuoteRecord) => Promise<void>;
  updateQuote: (quoteId: string, patch: Partial<QuoteRecord>) => Promise<void>;
  deleteQuote: (quoteId: string) => Promise<void>;
  deleteVisualiserSession: (sessionId: string) => Promise<void>;
  addProductionOrder: (order: ProductionOrder) => Promise<void>;
  updateProductionOrder: (orderId: string, patch: Partial<ProductionOrder>) => Promise<void>;
  moveProductionOrder: (orderId: string, status: ProductionStage) => Promise<void>;
  deleteProductionOrder: (orderId: string) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  updateInventoryItem: (inventoryId: string, patch: Partial<InventoryItem>) => Promise<void>;
  deleteInventoryItem: (inventoryId: string) => Promise<void>;
  addAccountingRecord: (record: AccountingRecord) => Promise<void>;
  updateAccountingRecord: (recordId: string, patch: Partial<AccountingRecord>) => Promise<void>;
  deleteAccountingRecord: (recordId: string) => Promise<void>;
}

export const productionStages: ProductionStage[] = [
  'Confirmed Order',
  'Materials Sourced',
  'In Production',
  'Quality Check',
  'Ready for Delivery',
  'Delivered',
];

let authUnsubscribe: (() => void) | undefined;
let publicUnsubscribes: Array<() => void> = [];
let adminUnsubscribes: Array<() => void> = [];
let publicSubscriptionsStarted = false;
let adminSubscriptionsStarted = false;
let adminSubscriptionsRole: TeamMember['role'] | undefined;

const createInitialState = () => ({
  isAdminAuthenticated: false,
  authReady: false,
  authUser: undefined,
  activeAdminId: undefined,
  products: [] as Product[],
  adminProducts: [] as Product[],
  materials: [] as Material[],
  adminMaterials: [] as Material[],
  sampleRooms: [] as SampleRoom[],
  adminSampleRooms: [] as SampleRoom[],
  testimonials: [] as Testimonial[],
  adminTestimonials: [] as Testimonial[],
  portfolioProjects: [] as PortfolioProject[],
  adminPortfolioProjects: [] as PortfolioProject[],
  publicTeamMembers: [] as TeamMember[],
  teamMembers: [] as TeamMember[],
  companySettings: clone(emptyCompanySettings),
  notificationTemplates: [] as NotificationTemplate[],
  automationRules: [] as AutomationRule[],
  notifications: [] as NotificationRecord[],
  enquiries: [] as Enquiry[],
  visualiserSessions: [] as VisualiserSession[],
  consultations: [] as Consultation[],
  quotes: [] as QuoteRecord[],
  productionOrders: [] as ProductionOrder[],
  inventoryItems: [] as InventoryItem[],
  accountingRecords: [] as AccountingRecord[],
  visualiserDraft: clone(defaultVisualiserDraft),
  configuratorDraft: clone(defaultConfiguratorDraft),
  localVisualiserSessions: [] as VisualiserSession[],
  productsLoaded: false,
  publicDataReady: false,
  adminDataReady: false,
  lastError: undefined as string | undefined,
});

function currentUser(get: () => TailoredStore) {
  const authUser = get().authUser;
  return authUser ? { uid: authUser.uid, email: authUser.email } : null;
}

function setError(set: (partial: Partial<TailoredStore> | ((state: TailoredStore) => Partial<TailoredStore>)) => void, message: string) {
  set({ lastError: message });
}

function mergeCompanySettings(base: CompanySettings, templates: NotificationTemplate[]) {
  return {
    ...clone(emptyCompanySettings),
    ...base,
    socialHandles: {
      ...clone(emptyCompanySettings.socialHandles),
      ...base.socialHandles,
    },
    defaultLeadTimes: {
      ...clone(emptyCompanySettings.defaultLeadTimes),
      ...base.defaultLeadTimes,
    },
    websiteMedia: {
      ...(clone(emptyCompanySettings.websiteMedia) || {}),
      ...(base.websiteMedia || {}),
    },
    notificationTemplates: templates,
  };
}

function createInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'TM'
  );
}

function mergeRecord<T extends { id: string }>(items: T[], record: T) {
  const existing = items.some((item) => item.id === record.id);
  if (existing) {
    return items.map((item) => (item.id === record.id ? record : item));
  }
  return [record, ...items];
}

function syncVisibleRecord<T extends { id: string; visibleOnSite?: boolean }>(
  items: T[],
  record: T,
) {
  if (record.visibleOnSite === false) {
    return items.filter((item) => item.id !== record.id);
  }
  return mergeRecord(items, record);
}

function stopAdminListeners(set: (partial: Partial<TailoredStore> | ((state: TailoredStore) => Partial<TailoredStore>)) => void) {
  adminUnsubscribes.forEach((unsubscribe) => unsubscribe());
  adminUnsubscribes = [];
  adminSubscriptionsStarted = false;
  adminSubscriptionsRole = undefined;
  set((state) => ({
    adminProducts: [],
    adminMaterials: [],
    adminSampleRooms: [],
    adminTestimonials: [],
    adminPortfolioProjects: [],
    teamMembers: [],
    notificationTemplates: [],
    automationRules: [],
    notifications: [],
    enquiries: [],
    visualiserSessions: [],
    consultations: [],
    quotes: [],
    productionOrders: [],
    inventoryItems: [],
    accountingRecords: [],
    adminDataReady: false,
    companySettings: {
      ...state.companySettings,
      notificationTemplates: [],
    },
  }));
}

function startPublicListeners(
  set: (partial: Partial<TailoredStore> | ((state: TailoredStore) => Partial<TailoredStore>)) => void,
  get: () => TailoredStore,
) {
  if (publicSubscriptionsStarted) return;
  publicSubscriptionsStarted = true;

  publicUnsubscribes = [
    subscribePublishedProducts(
      (products) => {
        set({
          products,
          productsLoaded: true,
          publicDataReady: true,
          lastError: undefined,
        });
      },
      (message) => setError(set, message),
    ),
    subscribeMaterials(
      (materials) => set({ materials, publicDataReady: true }),
      (message) => setError(set, message),
    ),
    subscribeSampleRooms(
      (sampleRooms) => set({ sampleRooms, publicDataReady: true }),
      (message) => setError(set, message),
    ),
    subscribeTestimonials(
      (testimonials) => set({ testimonials, publicDataReady: true }),
      (message) => setError(set, message),
    ),
    subscribePortfolioProjects(
      (portfolioProjects) => set({ portfolioProjects, publicDataReady: true }),
      (message) => setError(set, message),
    ),
    subscribePublicTeamProfiles(
      (publicTeamMembers) => set({ publicTeamMembers, publicDataReady: true }),
      (message) => setError(set, message),
    ),
    subscribeCompanySettings(
      (settings) => {
        set((state) => ({
          companySettings: mergeCompanySettings(settings, state.notificationTemplates),
          publicDataReady: true,
        }));
      },
      (message) => setError(set, message),
    ),
  ];

  void fetchCompanySettings().then((settings) => {
    set((state) => ({
      companySettings: mergeCompanySettings(settings, state.notificationTemplates),
    }));
  });
}

function startAdminListeners(
  set: (partial: Partial<TailoredStore> | ((state: TailoredStore) => Partial<TailoredStore>)) => void,
  get: () => TailoredStore,
  role: TeamMember['role'],
) {
  if (adminSubscriptionsStarted && adminSubscriptionsRole === role) return;
  if (adminSubscriptionsStarted) {
    stopAdminListeners(set);
  }

  adminSubscriptionsStarted = true;
  adminSubscriptionsRole = role;

  const nextUnsubscribes: Array<() => void> = [];
  const addSubscription = (enabled: boolean, factory: () => () => void) => {
    if (!enabled) return;
    nextUnsubscribes.push(factory());
  };

  const canAccessProducts = canAccessWorkspace('products', role);
  const canAccessMaterials = canAccessWorkspace('materials', role);
  const canAccessPipeline = canAccessWorkspace('pipeline', role);
  const canAccessJobs = canAccessWorkspace('jobs', role);
  const canAccessFinance = canAccessWorkspace('finance', role);
  const canAccessSystem = canAccessWorkspace('system', role);

  addSubscription(
    canAccessProducts,
    () => subscribeAdminProducts(
      (adminProducts) => set({ adminProducts, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessMaterials,
    () => subscribeAdminMaterials(
      (adminMaterials) => set({ adminMaterials, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessSystem,
    () => subscribeAdminSampleRooms(
      (adminSampleRooms) => set({ adminSampleRooms, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessSystem,
    () => subscribeAdminTestimonials(
      (adminTestimonials) => set({ adminTestimonials, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessSystem,
    () => subscribeAdminPortfolioProjects(
      (adminPortfolioProjects) => set({ adminPortfolioProjects, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    true,
    () => subscribeTeamMembers(
      (teamMembers) => {
        const normalizedTeamMembers = teamMembers.map((member) => ({
          ...member,
          initials: member.initials || createInitials(member.name),
        }));
        const authUser = get().authUser;
        const matchedMember = normalizedTeamMembers.find(
          (member) =>
            member.uid === authUser?.uid ||
            member.email.toLowerCase() === authUser?.email?.toLowerCase(),
        );

        if (authUser && matchedMember && matchedMember.role !== authUser.role) {
          void refreshAdminSession()
            .then((session) => {
              if (!session?.approved) {
                stopAdminListeners(set);
                set({
                  isAdminAuthenticated: false,
                  authUser: undefined,
                  activeAdminId: undefined,
                  lastError: 'This account is no longer approved for the admin workspace.',
                });
                return;
              }
              set((state) => ({
                authUser: {
                  uid: session.user.uid,
                  email: session.user.email,
                  role: session.role,
                },
                activeAdminId:
                  state.activeAdminId && normalizedTeamMembers.some((member) => member.id === state.activeAdminId)
                    ? state.activeAdminId
                    : normalizedTeamMembers.find((member) => member.uid === session.user.uid)?.id ??
                      normalizedTeamMembers.find((member) => member.email.toLowerCase() === session.user.email?.toLowerCase())?.id ??
                      normalizedTeamMembers[0]?.id ??
                      state.activeAdminId,
              }));
              startAdminListeners(set, get, session.role);
            })
            .catch((error) => {
              console.error('Failed to refresh auth session after team sync:', error);
            });
        }

        set((state) => ({
          teamMembers: normalizedTeamMembers,
          activeAdminId:
            state.activeAdminId && normalizedTeamMembers.some((member) => member.id === state.activeAdminId)
              ? state.activeAdminId
              : normalizedTeamMembers.find((member) => member.uid === state.authUser?.uid)?.id ??
                normalizedTeamMembers.find((member) => member.email.toLowerCase() === state.authUser?.email?.toLowerCase())?.id ??
                normalizedTeamMembers[0]?.id ??
                state.activeAdminId,
          adminDataReady: true,
        }));
      },
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    true,
    () => subscribeAdminCompanySettings(
      (settings) =>
        set((state) => ({
          companySettings: mergeCompanySettings(settings, state.notificationTemplates),
          adminDataReady: true,
        })),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessSystem,
    () => subscribeTemplates(
      (notificationTemplates) =>
        set((state) => ({
          notificationTemplates,
          companySettings: {
            ...state.companySettings,
            notificationTemplates,
          },
          adminDataReady: true,
        })),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessSystem,
    () => subscribeAutomations(
      (automationRules) => set({ automationRules, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    true,
    () => subscribeNotifications(
      role,
      (notifications) => set({ notifications, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessPipeline,
    () => subscribeEnquiries(
      (enquiries) => set({ enquiries, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessPipeline,
    () => subscribeVisualiserSessions(
      (visualiserSessions) => set({ visualiserSessions, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessPipeline,
    () => subscribeConsultations(
      (consultations) => set({ consultations, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessPipeline,
    () => subscribeQuotes(
      (quotes) => set({ quotes, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessJobs,
    () => subscribeProductionOrders(
      (productionOrders) => set({ productionOrders, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessMaterials,
    () => subscribeInventoryItems(
      (inventoryItems) => set({ inventoryItems, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );
  addSubscription(
    canAccessFinance,
    () => subscribeAccountingRecords(
      (accountingRecords) => set({ accountingRecords, adminDataReady: true }),
      (message) => setError(set, message),
    ),
  );

  adminUnsubscribes = nextUnsubscribes;
}

export const useTailoredStore = create<TailoredStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      loginAdmin: () => false,
      logoutAdmin: () => {
        void signOutAdminRemote().catch((error) => {
          console.error('Failed to sign out:', error);
        });
        stopAdminListeners(set);
        set({
          isAdminAuthenticated: false,
          authUser: undefined,
          activeAdminId: undefined,
        });
      },
      initAuth: () => {
        startPublicListeners(set, get);
        if (authUnsubscribe) return;

        authUnsubscribe = watchAuthSession((session) => {
          if (session?.approved) {
            set({
              isAdminAuthenticated: true,
              authReady: true,
              authUser: {
                uid: session.user.uid,
                email: session.user.email,
                role: session.role,
              },
              lastError: undefined,
            });
            startAdminListeners(set, get, session.role);
            return;
          }

          stopAdminListeners(set);
          set({
            isAdminAuthenticated: false,
            authReady: true,
            authUser: undefined,
            activeAdminId: undefined,
            lastError: session ? 'This account is signed in but is not approved for the admin workspace.' : undefined,
          });
        });
      },
      signInAdmin: async (email, password) => {
        try {
          await signInAdminRemote(email, password);
          const session = await refreshAdminSession();
          if (!session?.approved) {
            await signOutAdminRemote();
            set({
              lastError: session?.status === 'Disabled'
                ? 'This account has been disabled and can no longer access the admin workspace.'
                : 'This account is signed in, but it has not been approved for admin access.',
            });
            return false;
          }
          set({ lastError: undefined });
          return true;
        } catch (error) {
          console.error('Firebase sign-in failed:', error);
          set({ lastError: 'Firebase login failed. Confirm the account exists and has admin access.' });
          return false;
        }
      },
      setActiveAdmin: (adminId) => set({ activeAdminId: adminId }),
      addProduct: async (product) => {
        const user = currentUser(get);
        const isPublished =
          product.publishedToWebsite ??
          product.website?.isPublished ??
          false;
        const optimistic = {
          ...product,
          publishedToWebsite: isPublished,
          website: {
            isPublished: product.website?.isPublished ?? isPublished,
            visibility: product.website?.visibility ?? (isPublished ? 'public' : 'internal'),
            featured: product.website?.featured ?? false,
            featuredOrder: product.website?.featuredOrder ?? 999,
            storeTitle: product.website?.storeTitle ?? product.name,
            storeSummary: product.website?.storeSummary ?? product.summary,
            storeDescription: product.website?.storeDescription ?? product.description,
            seoTitle: product.website?.seoTitle ?? product.name,
            seoDescription: product.website?.seoDescription ?? product.summary,
            publishedAt: product.website?.publishedAt ?? null,
            publishedBy: product.website?.publishedBy ?? null,
          },
        };
        set((state) => ({ adminProducts: [optimistic, ...state.adminProducts] }));
        await createProductRemote(optimistic, user);
      },
      updateProduct: async (productId, patch) => {
        const user = currentUser(get);
        set((state) => ({
          adminProducts: state.adminProducts.map((product) => {
            if (product.id !== productId) return product;
            const nextStatus = patch.status ?? product.status;
            const nextPublished =
              patch.publishedToWebsite ??
              patch.website?.isPublished ??
              product.publishedToWebsite ??
              product.website?.isPublished ??
              false;
            const website = patch.website
              ? { ...product.website, ...patch.website }
              : {
                  ...product.website,
                  isPublished: nextPublished,
                  visibility:
                    nextPublished
                      ? 'public'
                      : product.website?.visibility ?? 'internal',
                  publishedAt:
                    nextPublished
                      ? product.website?.publishedAt ?? new Date().toISOString()
                      : null,
                  publishedBy:
                    nextPublished
                      ? product.website?.publishedBy ?? user?.uid ?? null
                      : null,
                };
            return { ...product, ...patch, publishedToWebsite: nextPublished, website };
          }),
        }));
        await updateProductRemote(productId, patch, user);
      },
      deleteProduct: async (productId) => {
        set((state) => ({
          adminProducts: state.adminProducts.filter((product) => product.id !== productId),
        }));
        await deleteProductRemote(productId);
      },
      loadProducts: async () => {
        startPublicListeners(set, get);
      },
      addMaterial: async (material) => {
        set((state) => ({
          adminMaterials: mergeRecord(state.adminMaterials, material),
          materials: syncVisibleRecord(state.materials, material),
        }));
        await createMaterialRemote(material, currentUser(get));
      },
      updateMaterial: async (materialId, patch) => {
        set((state) => {
          const existing = state.adminMaterials.find((material) => material.id === materialId);
          if (!existing) return {};
          const next = { ...existing, ...patch };
          return {
            adminMaterials: state.adminMaterials.map((material) =>
              material.id === materialId ? next : material,
            ),
            materials: syncVisibleRecord(
              state.materials.filter((material) => material.id !== materialId),
              next,
            ),
          };
        });
        await updateMaterialRemote(materialId, patch, currentUser(get));
      },
      deleteMaterial: async (materialId) => {
        set((state) => ({
          adminMaterials: state.adminMaterials.filter((material) => material.id !== materialId),
          materials: state.materials.filter((material) => material.id !== materialId),
        }));
        await deleteMaterialRemote(materialId);
      },
      addSampleRoom: async (room) => {
        set((state) => ({
          adminSampleRooms: mergeRecord(state.adminSampleRooms, room),
          sampleRooms: syncVisibleRecord(state.sampleRooms, room),
        }));
        await createSampleRoomRemote(room, currentUser(get));
      },
      updateSampleRoom: async (roomId, patch) => {
        set((state) => {
          const existing = state.adminSampleRooms.find((room) => room.id === roomId);
          if (!existing) return {};
          const next = { ...existing, ...patch };
          return {
            adminSampleRooms: state.adminSampleRooms.map((room) =>
              room.id === roomId ? next : room,
            ),
            sampleRooms: syncVisibleRecord(
              state.sampleRooms.filter((room) => room.id !== roomId),
              next,
            ),
          };
        });
        await updateSampleRoomRemote(roomId, patch, currentUser(get));
      },
      deleteSampleRoom: async (roomId) => {
        set((state) => ({
          adminSampleRooms: state.adminSampleRooms.filter((room) => room.id !== roomId),
          sampleRooms: state.sampleRooms.filter((room) => room.id !== roomId),
        }));
        await deleteSampleRoomRemote(roomId);
      },
      addTestimonial: async (testimonial) => {
        set((state) => ({
          adminTestimonials: mergeRecord(state.adminTestimonials, testimonial),
          testimonials: syncVisibleRecord(state.testimonials, testimonial),
        }));
        await createTestimonialRemote(testimonial, currentUser(get));
      },
      updateTestimonial: async (testimonialId, patch) => {
        set((state) => {
          const existing = state.adminTestimonials.find(
            (testimonial) => testimonial.id === testimonialId,
          );
          if (!existing) return {};
          const next = { ...existing, ...patch };
          return {
            adminTestimonials: state.adminTestimonials.map((testimonial) =>
              testimonial.id === testimonialId ? next : testimonial,
            ),
            testimonials: syncVisibleRecord(
              state.testimonials.filter((testimonial) => testimonial.id !== testimonialId),
              next,
            ),
          };
        });
        await updateTestimonialRemote(testimonialId, patch, currentUser(get));
      },
      deleteTestimonial: async (testimonialId) => {
        set((state) => ({
          adminTestimonials: state.adminTestimonials.filter(
            (testimonial) => testimonial.id !== testimonialId,
          ),
          testimonials: state.testimonials.filter((testimonial) => testimonial.id !== testimonialId),
        }));
        await deleteTestimonialRemote(testimonialId);
      },
      addPortfolioProject: async (project) => {
        set((state) => ({
          adminPortfolioProjects: mergeRecord(state.adminPortfolioProjects, project),
          portfolioProjects: syncVisibleRecord(state.portfolioProjects, project),
        }));
        await createPortfolioProjectRemote(project, currentUser(get));
      },
      updatePortfolioProject: async (projectId, patch) => {
        set((state) => {
          const existing = state.adminPortfolioProjects.find((project) => project.id === projectId);
          if (!existing) return {};
          const next = { ...existing, ...patch };
          return {
            adminPortfolioProjects: state.adminPortfolioProjects.map((project) =>
              project.id === projectId ? next : project,
            ),
            portfolioProjects: syncVisibleRecord(
              state.portfolioProjects.filter((project) => project.id !== projectId),
              next,
            ),
          };
        });
        await updatePortfolioProjectRemote(projectId, patch, currentUser(get));
      },
      deletePortfolioProject: async (projectId) => {
        set((state) => ({
          adminPortfolioProjects: state.adminPortfolioProjects.filter(
            (project) => project.id !== projectId,
          ),
          portfolioProjects: state.portfolioProjects.filter((project) => project.id !== projectId),
        }));
        await deletePortfolioProjectRemote(projectId);
      },
      updateCompanySettings: async (patch) => {
        const current = get().companySettings;
        const merged = mergeCompanySettings(
          {
            ...current,
            ...patch,
            socialHandles: {
              ...current.socialHandles,
              ...patch.socialHandles,
            },
            defaultLeadTimes: {
              ...current.defaultLeadTimes,
              ...patch.defaultLeadTimes,
            },
            websiteMedia: {
              ...(current.websiteMedia || {}),
              ...(patch.websiteMedia || {}),
            },
          },
          get().notificationTemplates,
        );
        set({ companySettings: merged });
        await updateCompanySettingsRemote(
          {
            ...merged,
            notificationTemplates: undefined,
          },
          currentUser(get),
        );
      },
      addTeamMember: async (member) => {
        try {
          return await createTeamMemberRemote(member);
        } catch (error) {
          console.error('Failed to create team member:', error);
          set({ lastError: 'Unable to create the team member account right now.' });
          return null;
        }
      },
      updateTeamMember: async (teamMemberId, patch) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((member) =>
            member.id === teamMemberId ? { ...member, ...patch } : member,
          ),
        }));
        await updateTeamMemberRemote(teamMemberId, patch, currentUser(get));
      },
      disableTeamMember: async (teamMemberId) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((member) =>
            member.id === teamMemberId ? { ...member, status: 'Disabled' } : member,
          ),
        }));
        await disableTeamMemberRemote(teamMemberId);
      },
      addNotificationTemplate: async (template) => {
        const notificationTemplates = [template, ...get().notificationTemplates];
        set((state) => ({
          notificationTemplates,
          companySettings: {
            ...state.companySettings,
            notificationTemplates,
          },
        }));
        await createTemplateRemote(template, currentUser(get));
      },
      updateNotificationTemplate: async (templateId, patch) => {
        set((state) => {
          const notificationTemplates = state.notificationTemplates.map((template) =>
            template.id === templateId ? { ...template, ...patch } : template,
          );
          return {
            notificationTemplates,
            companySettings: {
              ...state.companySettings,
              notificationTemplates,
            },
          };
        });
        await updateTemplateRemote(templateId, patch, currentUser(get));
      },
      deleteNotificationTemplate: async (templateId) => {
        set((state) => {
          const notificationTemplates = state.notificationTemplates.filter(
            (template) => template.id !== templateId,
          );
          return {
            notificationTemplates,
            companySettings: {
              ...state.companySettings,
              notificationTemplates,
            },
          };
        });
        await deleteTemplateRemote(templateId);
      },
      addAutomationRule: async (automation) => {
        set((state) => ({
          automationRules: [automation, ...state.automationRules],
        }));
        await createAutomationRemote(automation, currentUser(get));
      },
      updateAutomationRule: async (automationId, patch) => {
        set((state) => ({
          automationRules: state.automationRules.map((automation) =>
            automation.id === automationId ? { ...automation, ...patch } : automation,
          ),
        }));
        await updateAutomationRemote(automationId, patch, currentUser(get));
      },
      deleteAutomationRule: async (automationId) => {
        set((state) => ({
          automationRules: state.automationRules.filter((automation) => automation.id !== automationId),
        }));
        await deleteAutomationRemote(automationId);
      },
      markNotificationRead: async (notificationId) => {
        const uid = get().authUser?.uid;
        if (!uid) return;
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId && !notification.readBy.includes(uid)
              ? { ...notification, readBy: [...notification.readBy, uid] }
              : notification,
          ),
        }));
        await markNotificationReadRemote(notificationId);
      },
      markAllNotificationsRead: async () => {
        const uid = get().authUser?.uid;
        if (!uid) return;
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.readBy.includes(uid)
              ? notification
              : { ...notification, readBy: [...notification.readBy, uid] },
          ),
        }));
        await markAllNotificationsReadRemote();
      },
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
          roomPhotoPath: state.visualiserDraft.roomPhotoPath,
          roomName: state.visualiserDraft.roomName || 'Saved room',
          placedItems: clone(state.visualiserDraft.items),
          submittedAt: new Date().toISOString(),
          status: 'New',
        };
        set((current) => ({
          localVisualiserSessions: [session, ...current.localVisualiserSessions],
        }));
        return sessionId;
      },
      loadVisualiserSession: (sessionId) => {
        const session =
          get().localVisualiserSessions.find((item) => item.id === sessionId) ??
          get().visualiserSessions.find((item) => item.id === sessionId);
        if (!session) {
          return;
        }
        set({
          visualiserDraft: {
            roomPhotoUrl: session.roomPhotoUrl,
            roomPhotoPath: session.roomPhotoPath,
            roomName: session.roomName,
            items: clone(session.placedItems),
            gridEnabled: true,
            zoom: 1,
          },
        });
      },
      updateVisualiserSessionStatus: async (sessionId, status) => {
        set((state) => ({
          visualiserSessions: state.visualiserSessions.map((session) =>
            session.id === sessionId ? { ...session, status } : session,
          ),
        }));
        await updateVisualiserSessionStatusRemote(sessionId, status, currentUser(get));
      },
      createVisualiserSubmission: async (payload) => {
        const state = get();
        if (!state.visualiserDraft.roomPhotoUrl) {
          throw new Error('A room photo is required before submitting the visualiser.');
        }

        const sessionId = generateId('vis');
        const enquiryId = generateId('enq');
        let roomPhotoUrl = state.visualiserDraft.roomPhotoUrl;
        let roomPhotoPath = state.visualiserDraft.roomPhotoPath ?? null;

        if (roomPhotoUrl.startsWith('data:')) {
          const upload = await uploadPublicSubmissionDataUrl(
            roomPhotoUrl,
            'visualiser',
            sessionId,
            `${state.visualiserDraft.roomName || 'room'}.jpg`,
          );
          roomPhotoUrl = upload.url;
          roomPhotoPath = upload.path;
        }

        const teamMembers = get().teamMembers;
        const { defaultOwner, defaultDesigner } = getDefaultAssignments(teamMembers);
        const session: VisualiserSession = {
          id: sessionId,
          roomPhotoUrl,
          roomPhotoPath,
          roomName: state.visualiserDraft.roomName || 'Custom room upload',
          placedItems: clone(state.visualiserDraft.items),
          submittedAt: new Date().toISOString(),
          status: payload.preferredDateTime ? 'Consultation Booked' : 'New',
          clientName: payload.clientName,
          phone: payload.phone,
          email: payload.email,
          assignedTo: defaultOwner,
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
          assignedTo: defaultOwner,
          channel: 'Visualiser Submission',
          sourceLabel: 'Visualiser Submission',
          createdAt: new Date().toISOString(),
          notes: [
            {
              id: generateId('note'),
              author: 'System',
              message:
                payload.notes ||
                `Visualiser arrangement submitted with ${session.placedItems.length} pieces.`,
              createdAt: new Date().toISOString(),
            },
          ],
          visualiserSessionId: sessionId,
          visualiserScreenshot: roomPhotoUrl,
          read: false,
        };

        const consultation =
          payload.preferredDateTime
            ? {
                id: generateId('con'),
                enquiryId,
                clientName: payload.clientName,
                phone: payload.phone,
                email: payload.email,
                scheduledAt: payload.preferredDateTime,
                assignedDesigner: defaultDesigner ?? '',
                status: 'Scheduled' as const,
                source: 'visualiser' as const,
                notes: payload.notes || '',
                visualiserSessionId: sessionId,
              }
            : undefined;

        await createVisualiserSubmissionRemote(session, enquiry, consultation, currentUser(get));
        set({
          visualiserDraft: clone(defaultVisualiserDraft),
        });
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
      createQuoteRequest: async (payload) => {
        const state = get();
        const selectedProduct = state.products.find((product) => product.id === state.configuratorDraft.productId);
        const enquiryId = generateId('enq');
        let customDesignImage = state.configuratorDraft.customDesignImage;
        let customDesignImagePath = state.configuratorDraft.customDesignImagePath ?? null;
        let uploadedSpacePhoto = state.configuratorDraft.uploadedSpacePhoto;
        let uploadedSpacePhotoPath = state.configuratorDraft.uploadedSpacePhotoPath ?? null;

        if (customDesignImage?.startsWith('data:')) {
          const upload = await uploadPublicSubmissionDataUrl(
            customDesignImage,
            'configurator',
            `${enquiryId}-custom`,
            'custom-design.jpg',
          );
          customDesignImage = upload.url;
          customDesignImagePath = upload.path;
        }

        if (uploadedSpacePhoto?.startsWith('data:')) {
          const upload = await uploadPublicSubmissionDataUrl(
            uploadedSpacePhoto,
            'configurator',
            `${enquiryId}-space`,
            'space-photo.jpg',
          );
          uploadedSpacePhoto = upload.url;
          uploadedSpacePhotoPath = upload.path;
        }

        const teamMembers = get().teamMembers;
        const { defaultOwner, defaultDesigner } = getDefaultAssignments(teamMembers);

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
          customDesignImage,
          customDesignImagePath,
          customDesignNotes: state.configuratorDraft.customDesignNotes,
          uploadedSpacePhoto,
          uploadedSpacePhotoPath,
          sizeLabel: state.configuratorDraft.sizePresetId || state.configuratorDraft.dimensionMode,
          estimatedPrice: (() => {
            if (!selectedProduct && !state.configuratorDraft.isCustomDesign) return 0;
            const base = selectedProduct?.priceFrom ?? 60000;
            const materialMultiplier =
              state.configuratorDraft.materialId === 'rosewood'
                ? 1.18
                : state.configuratorDraft.materialId === 'mahogany'
                  ? 1.12
                  : state.configuratorDraft.materialId === 'teak'
                    ? 1.08
                    : 1;
            const volumeFactor =
              state.configuratorDraft.dimensionMode === 'custom'
                ? Math.max(
                    0.85,
                    Math.min(
                      1.9,
                      (state.configuratorDraft.dimensions.width *
                        state.configuratorDraft.dimensions.depth *
                        state.configuratorDraft.dimensions.height) /
                        (220 * 100 * 76),
                    ),
                  )
                : 1;
            return Math.round(
              base * materialMultiplier * volumeFactor * state.configuratorDraft.quantity,
            );
          })(),
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
          assignedTo: defaultOwner,
          channel: 'Configure Page',
          sourceLabel: 'Configure Page',
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
          configuration: configurationData,
          configurationData,
          read: false,
        };

        const consultation =
          payload?.preferredDateTime
            ? {
                id: generateId('con'),
                enquiryId,
                clientName: state.configuratorDraft.clientName,
                phone: state.configuratorDraft.phone,
                email: state.configuratorDraft.email,
                scheduledAt: payload.preferredDateTime,
                assignedDesigner: defaultDesigner ?? '',
                status: 'Scheduled' as const,
                source: 'configurator' as const,
                notes: state.configuratorDraft.notes,
              }
            : undefined;

        await createQuoteRequestRemote(enquiry, consultation, currentUser(get));
        set({ configuratorDraft: clone(defaultConfiguratorDraft) });
        return { enquiryId };
      },
      createConsultationRequest: async (payload) => {
        const enquiryId = generateId('enq');
        const consultationId = generateId('con');
        const teamMembers = get().teamMembers;
        const { defaultOwner, defaultDesigner } = getDefaultAssignments(teamMembers);
        const enquiry: Enquiry = {
          id: enquiryId,
          type: payload.source,
          clientName: payload.clientName,
          phone: payload.phone,
          email: payload.email,
          productIds: payload.productIds ?? [],
          productNames: payload.productNames ?? [],
          status: 'Consultation Scheduled',
          assignedTo: defaultOwner,
          channel: payload.source === 'consultation' ? 'Book Consultation' : payload.source,
          sourceLabel:
            payload.source === 'consultation' ? 'Book Consultation' : payload.source,
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
          read: false,
        };
        const consultation: Consultation = {
          id: consultationId,
          enquiryId,
          clientName: payload.clientName,
          phone: payload.phone,
          email: payload.email,
          scheduledAt: payload.preferredDateTime,
          assignedDesigner: defaultDesigner ?? '',
          status: 'Scheduled',
          source: payload.source,
          notes: payload.notes,
        };
        await createConsultationRequestRemote(enquiry, consultation, currentUser(get));
        return { enquiryId, consultationId };
      },
      addEnquiry: async (enquiry) => {
        await createEnquiryRemote(enquiry, currentUser(get));
      },
      updateEnquiry: async (enquiryId, patch) => {
        set((state) => ({
          enquiries: state.enquiries.map((enquiry) =>
            enquiry.id === enquiryId ? { ...enquiry, ...patch } : enquiry,
          ),
        }));
        await updateEnquiryRemote(enquiryId, patch, currentUser(get));
      },
      deleteEnquiry: async (enquiryId) => {
        set((state) => ({
          enquiries: state.enquiries.filter((enquiry) => enquiry.id !== enquiryId),
        }));
        await deleteEnquiryRemote(enquiryId);
      },
      addEnquiryNote: async (enquiryId, author, message) => {
        const enquiry = get().enquiries.find((item) => item.id === enquiryId);
        if (!enquiry) return;
        const nextNotes = [
          ...enquiry.notes,
          {
            id: generateId('note'),
            author,
            message,
            createdAt: new Date().toISOString(),
          },
        ];
        set((state) => ({
          enquiries: state.enquiries.map((item) =>
            item.id === enquiryId ? { ...item, notes: nextNotes } : item,
          ),
        }));
        await addEnquiryNoteRemote(enquiryId, nextNotes, currentUser(get));
      },
      assignEnquiry: async (enquiryId, teamMemberId) => {
        await get().updateEnquiry(enquiryId, { assignedTo: teamMemberId });
      },
      addConsultation: async (consultation) => {
        await createConsultationRemote(consultation, currentUser(get));
      },
      updateConsultation: async (consultationId, patch) => {
        set((state) => ({
          consultations: state.consultations.map((consultation) =>
            consultation.id === consultationId ? { ...consultation, ...patch } : consultation,
          ),
        }));
        await updateConsultationRemote(consultationId, patch, currentUser(get));
      },
      deleteConsultation: async (consultationId) => {
        set((state) => ({
          consultations: state.consultations.filter(
            (consultation) => consultation.id !== consultationId,
          ),
        }));
        await deleteConsultationRemote(consultationId);
      },
      addQuote: async (quote) => {
        set((state) => ({
          quotes: [quote, ...state.quotes],
        }));
        await createQuoteRemote(quote, currentUser(get));
      },
      updateQuote: async (quoteId, patch) => {
        set((state) => ({
          quotes: state.quotes.map((quote) =>
            quote.id === quoteId ? { ...quote, ...patch } : quote,
          ),
        }));
        await updateQuoteRemote(quoteId, patch, currentUser(get));
      },
      deleteQuote: async (quoteId) => {
        set((state) => ({
          quotes: state.quotes.filter((quote) => quote.id !== quoteId),
        }));
        await deleteQuoteRemote(quoteId);
      },
      deleteVisualiserSession: async (sessionId) => {
        set((state) => ({
          visualiserSessions: state.visualiserSessions.filter((session) => session.id !== sessionId),
        }));
        await deleteVisualiserSessionRemote(sessionId);
      },
      addProductionOrder: async (order) => {
        set((state) => ({
          productionOrders: [order, ...state.productionOrders],
        }));
        try {
          await createProductionOrderRemote(order, currentUser(get));
        } catch (error) {
          set((state) => ({
            productionOrders: state.productionOrders.filter((item) => item.id !== order.id),
          }));
          throw error;
        }
      },
      updateProductionOrder: async (orderId, patch) => {
        const previousOrders = get().productionOrders;
        set((state) => ({
          productionOrders: state.productionOrders.map((order) =>
            order.id === orderId ? { ...order, ...patch } : order,
          ),
        }));
        try {
          await updateProductionOrderRemote(orderId, patch, currentUser(get));
        } catch (error) {
          set({ productionOrders: previousOrders });
          throw error;
        }
      },
      moveProductionOrder: async (orderId, status) => {
        const previousOrders = get().productionOrders;
        set((state) => ({
          productionOrders: state.productionOrders.map((order) =>
            order.id === orderId ? { ...order, status } : order,
          ),
        }));
        try {
          await moveProductionOrderRemote(orderId, status, currentUser(get));
        } catch (error) {
          set({ productionOrders: previousOrders });
          throw error;
        }
      },
      deleteProductionOrder: async (orderId) => {
        const previousOrders = get().productionOrders;
        set((state) => ({
          productionOrders: state.productionOrders.filter((order) => order.id !== orderId),
        }));
        try {
          await deleteProductionOrderRemote(orderId);
        } catch (error) {
          set({ productionOrders: previousOrders });
          throw error;
        }
      },
      addInventoryItem: async (item) => {
        set((state) => ({
          inventoryItems: [item, ...state.inventoryItems],
        }));
        await createInventoryItemRemote(item, currentUser(get));
      },
      updateInventoryItem: async (inventoryId, patch) => {
        set((state) => ({
          inventoryItems: state.inventoryItems.map((item) =>
            item.id === inventoryId ? { ...item, ...patch } : item,
          ),
        }));
        await updateInventoryItemRemote(inventoryId, patch, currentUser(get));
      },
      deleteInventoryItem: async (inventoryId) => {
        set((state) => ({
          inventoryItems: state.inventoryItems.filter((item) => item.id !== inventoryId),
        }));
        await deleteInventoryItemRemote(inventoryId);
      },
      addAccountingRecord: async (record) => {
        await createAccountingRecordRemote(record, currentUser(get));
      },
      updateAccountingRecord: async (recordId, patch) => {
        const existing = get().accountingRecords.find((record) => record.id === recordId);
        const previousRecords = get().accountingRecords;
        const nextPatch = {
          ...(existing ? { type: existing.type } : {}),
          ...patch,
        };
        set((state) => ({
          accountingRecords: state.accountingRecords.map((record) =>
            record.id === recordId ? { ...record, ...nextPatch } : record,
          ),
        }));
        try {
          await updateAccountingRecordRemote(recordId, nextPatch, currentUser(get));
        } catch (error) {
          set({ accountingRecords: previousRecords });
          throw error;
        }
      },
      deleteAccountingRecord: async (recordId) => {
        const existing = get().accountingRecords.find((record) => record.id === recordId);
        const previousRecords = get().accountingRecords;
        set((state) => ({
          accountingRecords: state.accountingRecords.filter((record) => record.id !== recordId),
        }));
        try {
          await deleteAccountingRecordRemote(recordId, existing?.type);
        } catch (error) {
          set({ accountingRecords: previousRecords });
          throw error;
        }
      },
    }),
    {
      name: 'tailored-manor-store',
      partialize: (state) => ({
        activeAdminId: state.activeAdminId,
        visualiserDraft: state.visualiserDraft,
        configuratorDraft: state.configuratorDraft,
        localVisualiserSessions: state.localVisualiserSessions,
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
