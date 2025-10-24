import { UserRole, RolePermissions } from '@/types/user'

export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'owner':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canManageUsers: true,
        canViewLogs: true
      }
    case 'admin':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canManageUsers: true,
        canViewLogs: true
      }
    case 'worker':
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canManageUsers: false,
        canViewLogs: false
      }
    case 'viewer':
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canViewLogs: false
      }
    default:
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canManageUsers: false,
        canViewLogs: false
      }
  }
}

export const canPerformAction = (userRole: UserRole, action: keyof RolePermissions): boolean => {
  const permissions = getRolePermissions(userRole)
  return permissions[action]
}

export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'owner': return 'Farm Owner'
    case 'admin': return 'Administrator'
    case 'worker': return 'Farm Worker'
    case 'viewer': return 'Viewer'
    default: return 'Unknown'
  }
}

export const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case 'owner': return 'bg-purple-100 text-purple-800'
    case 'admin': return 'bg-blue-100 text-blue-800'
    case 'worker': return 'bg-green-100 text-green-800'
    case 'viewer': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}