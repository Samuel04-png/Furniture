import type { TeamMember, TeamRole, TeamStatus } from '../../types';
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

type AssignableTeamMember = Pick<TeamMember, 'id' | 'role'> &
  Partial<Pick<TeamMember, 'status'>>;

const workspaceAccess: Record<TeamRole, AdminWorkspace[]> = {
  Owner: [...adminWorkspaces],
  Admin: ['command-center', 'pipeline', 'jobs', 'materials', 'finance', 'products'],
  Sales: ['command-center', 'pipeline'],
  Designer: ['command-center', 'pipeline', 'products', 'system'],
  'Production Manager': ['command-center', 'jobs', 'materials', 'products'],
  'Inventory Manager': ['command-center', 'materials'],
  Procurement: ['command-center', 'materials', 'finance'],
  Accountant: ['command-center', 'finance'],
  'Read Only': ['command-center'],
  Operations: [...adminWorkspaces],
  Workshop: ['command-center', 'jobs', 'materials'],
  Production: ['command-center', 'jobs', 'materials'],
  Inventory: ['command-center', 'materials'],
};

const permissionMatrix: Record<TeamRole, AdminPermission[]> = {
  Owner: [...adminPermissions],
  Admin: adminPermissions.filter(
    (permission) => permission !== 'system.view' && permission !== 'system.manage',
  ),
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
  ],
  Designer: [
    'dashboard.view',
    'lead.view',
    'consultation.view',
    'session.view',
    'quote.view',
    'product.view',
    'product.edit',
    'system.view',
  ],
  'Production Manager': [
    'dashboard.view',
    'job.view',
    'job.advance',
    'inventory.view',
    'product.view',
  ],
  'Inventory Manager': [
    'dashboard.view',
    'inventory.view',
    'inventory.adjust',
  ],
  Procurement: [
    'dashboard.view',
    'inventory.view',
    'procurement.manage',
    'finance.view',
    'finance.edit',
  ],
  Accountant: [
    'dashboard.view',
    'finance.view',
    'finance.edit',
  ],
  'Read Only': ['dashboard.view'],
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

export function hasAccess(role: TeamRole | null | undefined, workspace: AdminWorkspace) {
  return canAccessWorkspace(workspace, role);
}

export function canPerform(permission: AdminPermission, role?: TeamRole | null) {
  if (!role) return false;
  return permissionMatrix[normalizeRole(role)].includes(permission);
}

export function isActiveTeamMember(status?: TeamStatus | null) {
  return status !== 'Disabled';
}

export function canOwnLeads(role?: TeamRole | null) {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'Owner' || normalizedRole === 'Admin' || normalizedRole === 'Sales';
}

export function canTakeConsultations(role?: TeamRole | null) {
  if (!role) return false;
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'Owner' || normalizedRole === 'Admin' || normalizedRole === 'Designer';
}

export function getAssignableTeamMembers<T extends AssignableTeamMember>(
  teamMembers: T[],
  predicate: (role?: TeamRole | null) => boolean,
) {
  return teamMembers.filter((member) => isActiveTeamMember(member.status) && predicate(member.role));
}

export function getFirstAssignableTeamMemberId<T extends AssignableTeamMember>(
  teamMembers: T[],
  predicate: (role?: TeamRole | null) => boolean,
) {
  return getAssignableTeamMembers(teamMembers, predicate)[0]?.id;
}

export function getDefaultWorkspace(role?: TeamRole | null) {
  const normalizedRole = normalizeRole(role);
  return workspaceAccess[normalizedRole][0] ?? 'command-center';
}
