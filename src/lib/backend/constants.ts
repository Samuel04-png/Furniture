import type { CompanySettings, ProductCategory, TeamRole } from '../../types';

export const productCategoryDefaults: Record<ProductCategory, string> = {
  Seating: '6-8 weeks',
  Tables: '6-8 weeks',
  Storage: '6-8 weeks',
  Beds: '6-8 weeks',
  Office: '6-8 weeks',
  Outdoor: '6-8 weeks',
};

export const emptyCompanySettings: CompanySettings = {
  companyName: '',
  address: '',
  primaryPhone: '',
  secondaryPhone: '',
  email: '',
  whatsappNumber: '',
  socialHandles: {
    instagram: '',
    facebook: '',
  },
  showroomHours: [],
  defaultLeadTimes: productCategoryDefaults,
  notificationTemplates: [],
  websiteMedia: {},
};

export const supportedRoles: TeamRole[] = [
  'Owner',
  'Admin',
  'Sales',
  'Designer',
  'Production Manager',
  'Inventory Manager',
  'Procurement',
  'Accountant',
  'Read Only',
];

export const legacyRoleMap: Partial<Record<TeamRole, TeamRole>> = {
  Owner: 'Owner',
  Admin: 'Admin',
  Sales: 'Sales',
  Designer: 'Designer',
  'Production Manager': 'Production Manager',
  'Inventory Manager': 'Inventory Manager',
  Procurement: 'Procurement',
  Accountant: 'Accountant',
  'Read Only': 'Read Only',
  Operations: 'Admin',
  Workshop: 'Production Manager',
  Production: 'Production Manager',
  Inventory: 'Inventory Manager',
};

export function normalizeRole(role?: string | null): TeamRole {
  if (!role) return 'Read Only';
  const trimmedRole = role.trim();
  if ((supportedRoles as string[]).includes(trimmedRole)) {
    return trimmedRole as TeamRole;
  }
  const caseInsensitiveMatch = (supportedRoles as string[]).find(
    (entry) => entry.toLowerCase() === trimmedRole.toLowerCase(),
  );
  if (caseInsensitiveMatch) {
    return caseInsensitiveMatch as TeamRole;
  }
  const legacyMatch = (Object.keys(legacyRoleMap) as TeamRole[]).find(
    (entry) => entry.toLowerCase() === trimmedRole.toLowerCase(),
  );
  if (legacyMatch) {
    return legacyRoleMap[legacyMatch];
  }
  return 'Read Only';
}
