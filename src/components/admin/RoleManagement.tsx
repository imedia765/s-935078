
import React, { useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleManagement } from "./hooks/useRoleManagement";
import { UserTable } from "./components/UserTable";
import { ErrorView } from "./components/ErrorView";
import { AuditView } from "./components/AuditView";
import { RoleChangeRequests } from "./components/RoleChangeRequests";
import { RolePermissionsMatrix } from "./components/RolePermissionsMatrix";
import { CollectorsView } from "./components/CollectorsView";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SearchType = "full_name" | "email" | "id" | "member_number";

export function RoleManagement() {
  const {
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
    isFixingAll
  } = useRoleManagement();

  const filteredUsers = userData?.filter(user => {
    if (!searchTerm) return true;
    
    switch (searchType) {
      case "email":
        return user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      case "id":
        return user.id?.toLowerCase().includes(searchTerm.toLowerCase());
      case "member_number":
        return user.member_number?.toLowerCase().includes(searchTerm.toLowerCase());
      case "full_name":
        return user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      default:
        return true;
    }
  });

  const filteredValidations = roleValidation?.validation && Array.isArray(roleValidation.validation) 
    ? roleValidation.validation.filter((validation: any) =>
        validation.check_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(validation.details).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const filteredAuditLogs = roleValidation?.auditLogs && Array.isArray(roleValidation.auditLogs)
    ? roleValidation.auditLogs.filter((log: any) =>
        JSON.stringify(log.new_values).toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.operation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Determine if there are any issues to fix
  const hasIssues = filteredValidations.length > 0;

  // Wrapper function to match the expected void return type
  const handleMagicLinkGeneration = async (userId: string): Promise<void> => {
    await generateMagicLink(userId);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} aria-label="Role management sections">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Select
              value={searchType}
              onValueChange={(value: SearchType) => setSearchType(value)}
              aria-label="Search type"
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_name">Search by Name</SelectItem>
                <SelectItem value="email">Search by Email</SelectItem>
                <SelectItem value="id">Search by ID</SelectItem>
                <SelectItem value="member_number">Search by Member #</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={
                activeTab === "table" ? `Search by ${searchType.replace('_', ' ')}...` :
                activeTab === "errors" ? "Search errors by type or details..." :
                activeTab === "requests" ? "Search role change requests..." :
                activeTab === "permissions" ? "Search permissions..." :
                activeTab === "collectors" ? "Search collectors..." :
                "Search audit logs..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
              aria-label={`Search ${activeTab}`}
            />
          </div>
          {hasIssues && (
            <Button 
              variant="outline"
              onClick={handleFixAllIssues}
              disabled={isFixingAll}
              className="flex items-center gap-2"
              aria-busy={isFixingAll}
            >
              <RefreshCw className={`h-4 w-4 ${isFixingAll ? 'animate-spin' : ''}`} aria-hidden="true" />
              {isFixingAll ? 'Fixing Issues...' : 'Fix All Issues'}
            </Button>
          )}
        </div>

        <TabsList aria-label="Role management options">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="errors">Error View</TabsTrigger>
          <TabsTrigger value="requests">Change Requests</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="collectors">Active Collectors</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="errors" role="tabpanel">
          <ErrorView
            validations={filteredValidations}
            generateMagicLink={generateMagicLink}
            handleFixRoleError={handleFixRoleError}
            handleRoleChange={handleRoleChange}
          />
        </TabsContent>

        <TabsContent value="table" role="tabpanel">
          <UserTable 
            users={filteredUsers ?? []} 
            generateMagicLink={handleMagicLinkGeneration}
          />
        </TabsContent>

        <TabsContent value="requests" role="tabpanel">
          <RoleChangeRequests />
        </TabsContent>

        <TabsContent value="permissions" role="tabpanel">
          <RolePermissionsMatrix />
        </TabsContent>

        <TabsContent value="collectors" role="tabpanel">
          <CollectorsView />
        </TabsContent>

        <TabsContent value="audit" role="tabpanel">
          <AuditView auditLogs={filteredAuditLogs ?? []} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
