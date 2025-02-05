
import { UserPlus, UserMinus, UserSearch, CheckCircle2, CheckCheck, History as HistoryIcon } from "lucide-react";
import { ValidationDetails, FixOption, UserRole } from "../types/role-types";

export const getFixOptions = (
  checkType: string,
  details: ValidationDetails,
  handleRoleChange: (userId: string, newRole: UserRole) => Promise<void>,
  handleFixRoleError: (userId: string | undefined, checkType: string, fixType: UserRole | 'remove_role') => Promise<void>
): FixOption[] => {
  const baseOptions: FixOption[] = [
    {
      label: "Change to Member",
      value: "member",
      description: "Set role to basic member",
      icon: <UserMinus className="h-4 w-4" />,
      action: () => details?.auth_user_id ? handleRoleChange(details.auth_user_id, 'member') : Promise.resolve()
    },
    {
      label: "Change to Collector",
      value: "collector",
      description: "Set role to collector",
      icon: <UserSearch className="h-4 w-4" />,
      action: () => details?.auth_user_id ? handleRoleChange(details.auth_user_id, 'collector') : Promise.resolve()
    },
    {
      label: "Change to Admin",
      value: "admin",
      description: "Set role to admin",
      icon: <UserPlus className="h-4 w-4" />,
      action: () => details?.auth_user_id ? handleRoleChange(details.auth_user_id, 'admin') : Promise.resolve()
    }
  ];

  const additionalOptions: Record<string, FixOption[]> = {
    'Multiple Roles Assigned': [
      {
        label: "Remove Extra Roles",
        value: "remove_role",
        description: "Removes duplicate roles",
        icon: <CheckCircle2 className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'remove_role') : Promise.resolve()
      }
    ],
    'Member Without Role': [
      {
        label: "Add member role",
        value: "member",
        description: "Assigns the basic member role",
        icon: <UserPlus className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'member') : Promise.resolve()
      }
    ],
    'Collector Missing Role': [
      {
        label: "Add collector role",
        value: "collector",
        description: "Adds collector role",
        icon: <UserSearch className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'collector') : Promise.resolve()
      }
    ],
    'Inconsistent Member Status': [
      {
        label: "Add Member Role",
        value: "member",
        description: "Add member role",
        icon: <CheckCheck className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'member') : Promise.resolve()
      },
      {
        label: "Remove Current Role",
        value: "remove_role",
        description: "Remove current role",
        icon: <HistoryIcon className="h-4 w-4" />,
        action: () => details?.auth_user_id ? handleFixRoleError(details.auth_user_id, checkType, 'remove_role') : Promise.resolve()
      }
    ]
  };

  return [...(additionalOptions[checkType] || []), ...baseOptions];
};
