import type { TeamMember, TeamStatus } from '../../../types';
import { normalizeRole } from '../constants';

interface LegacyTeamMemberShape extends Partial<TeamMember> {
  displayName?: string;
  isActive?: boolean;
  lastLogin?: string;
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

function resolveStatus(member: LegacyTeamMemberShape): TeamStatus {
  if (member.status === 'Disabled' || member.isActive === false) {
    return 'Disabled';
  }
  if (member.status === 'Invited') {
    return 'Invited';
  }
  return 'Active';
}

export function normalizeTeamMemberRecord(
  memberId: string,
  raw: LegacyTeamMemberShape,
): TeamMember {
  const email = String(raw.email || '').trim().toLowerCase();
  const fallbackName =
    raw.name ||
    raw.displayName ||
    (email ? email.split('@')[0] : '') ||
    'Tailored Manor';

  return {
    id: memberId,
    uid: raw.uid || memberId,
    name: fallbackName,
    role: normalizeRole(raw.role),
    email,
    phone: raw.phone || '',
    initials: raw.initials || createInitials(fallbackName),
    status: resolveStatus(raw),
    avatarUrl: raw.avatarUrl,
    avatarPath: raw.avatarPath ?? null,
    bio: raw.bio || '',
    isPublicProfile: raw.isPublicProfile ?? false,
    lastLoginAt: raw.lastLoginAt || raw.lastLogin,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    createdBy: raw.createdBy ?? null,
    updatedBy: raw.updatedBy ?? null,
  };
}
