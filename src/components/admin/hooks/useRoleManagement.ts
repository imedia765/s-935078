
import { useState } from "react";
import { useMagicLink } from "./useMagicLink";
import { useRoleValidation } from "./useRoleValidation";
import { useUserRoles } from "./useUserRoles";

export const useRoleManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState<"full_name" | "email" | "id" | "member_number">("full_name");
  const [activeTab, setActiveTab] = useState("table");
  const [isFixingAll, setIsFixingAll] = useState(false);

  const { generateMagicLink } = useMagicLink();
  const { handleFixRoleError, handleFixAllIssues, roleValidation, isLoadingValidation, refetch: refetchValidation } = useRoleValidation();
  const { handleRoleChange, userData, isLoadingUsers, refetch: refetchUsers } = useUserRoles();

  const refetch = async () => {
    await Promise.all([refetchValidation(), refetchUsers()]);
  };

  return {
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    activeTab,
    setActiveTab,
    generateMagicLink,
    handleFixRoleError,
    handleRoleChange,
    handleFixAllIssues,
    userData,
    isLoadingUsers,
    roleValidation,
    isLoadingValidation,
    isFixingAll,
    refetch
  };
};
