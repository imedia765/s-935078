
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoleManagement } from "./hooks/useRoleManagement";
import { UserTable } from "./components/UserTable";
import { ErrorView } from "./components/ErrorView";
import { AuditView } from "./components/AuditView";

export function RoleManagement() {
  const {
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    generateMagicLink,
    handleFixRoleError,
    handleRoleChange,
    userData,
    isLoadingUsers,
    roleValidation,
    isLoadingValidation
  } = useRoleManagement();

  const filteredUsers = userData?.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.member_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredValidations = roleValidation?.validation?.filter((validation: any) =>
    validation.check_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(validation.details).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAuditLogs = roleValidation?.auditLogs?.filter((log: any) =>
    JSON.stringify(log.new_values).toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.operation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoadingUsers || isLoadingValidation) return <div>Loading...</div>;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={
              activeTab === "table" ? "Search by name, email, ID or member number..." :
              activeTab === "errors" ? "Search errors by type or details..." :
              "Search audit logs..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="errors">Error View</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <ErrorView
            validations={filteredValidations}
            generateMagicLink={generateMagicLink}
            handleFixRoleError={handleFixRoleError}
            handleRoleChange={handleRoleChange}
          />
        </TabsContent>

        <TabsContent value="table">
          <UserTable 
            users={filteredUsers ?? []} 
            generateMagicLink={generateMagicLink}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AuditView auditLogs={filteredAuditLogs ?? []} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
