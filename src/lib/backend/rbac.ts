import type { TeamRole } from '../../types';
import { normalizeRole } from './constants';

export const adminWorkspaces = [
  'command-center',
  'pipeline',
  'jobs',
  'materials',
  'finance',
  'products',
  'system',
] as const;

export type AdminWorkspace = (typeof adminWorkspaces)[number];

export const adminPermissions = [
  'dashboard.view',
  'lead.view',
  'lead.create',
  'lead.edit',
  'consultation.view',
  'consultation.create',
  'consultation.manage',
  'session.view',
  'session.manage',
  'quote.view',
  'quote.manage',
  'job.view',
  'job.advance',
  'inventory.view',
  'inventory.adjust',
  'procurement.manage',
  'finance.view',
  'finance.edit',
  'product.view',
  'product.create',
  'product.edit',
  'product.publish',
  'system.view',
  'system.manage',
] as const;

export type AdminPermission = (typeof adminPermissions)[number];

const workspaceAccess: Record<TeamRole, AdminWorkspace[]> = {
  Owner: [...adminWorkspaces],
  Admin: [...adminWorkspaces],
  Sales: ['command-center', 'pipeline', 'products'],
  Designer: ['command-center', 'pipeline', 'products'],
  'Production Manager': ['command-center', 'jobs', 'materials'],
  'Inventory Manager': ['command-center', 'materials', 'jobs'],
  Procurement: ['command-center', 'materials', 'jobs', 'finance'],
  Accountant: ['command-center', 'finance', 'pipeline'],
  'Read Only': ['command-center', 'pipeline', 'jobs', 'materials', 'finance', 'products'],
  Operations: [...adminWorkspaces],
  Workshop: ['command-center', 'jobs', 'materials'],
  Production: ['command-center', 'jobs', 'materials'],
  Inventory: ['command-center', 'materials', 'jobs'],
};

const permissionMatrix: Record<TeamRole, AdminPermission[]> = {
  Owner: [...adminPermissions],
  Admin: [...adminPermissions],
  Sales: [
    'dashboard.view',
    'lead.view',
    'lead.create',
    'lead.edit',
    'consultation.view',
    'consultation.create',
    'consultation.manage',
    'session.view',
    'session.manage',
    'quote.view',
    'quote.manage',
    'product.view',
  ],
  Designer: [
    'dashboard.view',
    'lead.view',
    'consultation.view',
    'consultation.manage',
    'session.view',
    'session.manage',
    'quote.view',
    'product.view',
    'product.edit',
  ],
  'Production Manager': [
    'dashboard.view',
    'job.view',
    'job.advance',
    'inventory.view',
  ],
  'Inventory Manager': [
    'dashboard.view',
    'inventory.view',
    'inventory.adjust',
    'job.view',
  ],
  Procurement: [
    'dashboard.view',
    'inventory.view',
    'procurement.manage',
    'finance.view',
    'job.view',
  ],
  Accountant: [
    'dashboard.view',
    'finance.view',
    'finance.edit',
    'lead.view',
    'consultation.view',
    'quote.view',
  ],
  'Read Only': [
    'dashboard.view',
    'lead.view',
    'consultation.view',
    'session.view',
    'quote.view',
    'job.view',
    'inventory.view',
    'finance.view',
    'product.view',
    'system.view',
  ],
  Operations: [...adminPermissions],
  Workshop: [
    'dashboard.view',
    'job.view',
    'job.advance',
    'inventory.view',
  ],
  Production: [
    'dashboard.view',
    'job.view',
    'job.advance',
    'inventory.view',
  ],
  Inventory: [
    'dashboard.view',
    'inventory.view',
    'inventory.adjust',
    'job.view',
  ],
};

export function canAccessWorkspace(workspace: AdminWorkspace, role?: TeamRole | null) {
  if (!role) return false;
  return workspaceAccess[normalizeRole(role)].includes(workspace);
}

export function canPerform(permission: AdminPermission, role?: TeamRole | null) {
  if (!role) return false;
  return permissionMatrix[normalizeRole(role)].includes(permission);
}
