
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleManagement } from "@/components/admin/RoleManagement";
import { MemberSearch } from "@/components/admin/member-search/MemberSearch";
import { MaintenanceManagement } from "@/components/admin/MaintenanceManagement";
import { AuditLogViewer } from "@/components/admin/audit/AuditLogViewer";
import { EmailServerDashboard } from "@/components/admin/email/EmailServerDashboard";
import { DatabaseManagement } from "@/components/admin/database/DatabaseManagement";
import { EmailStandardizationManager } from "@/components/admin/email/EmailStandardizationManager";
import { useState } from "react";
import { 
  ClipboardList, 
  Users, 
  Search, 
  Settings, 
  Mail, 
  Database, 
  FileCheck 
} from "lucide-react";

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("roles");

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6 text-gradient">Admin Dashboard</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full flex flex-col sm:flex-row gap-2 sm:gap-0 bg-transparent sm:bg-black/40 sm:backdrop-blur-xl border-0 sm:border sm:border-white/10">
          <TabsTrigger 
            value="audit" 
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Audit Logs</span>
          </TabsTrigger>
          <TabsTrigger 
            value="roles"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Users className="h-4 w-4" />
            <span>Role Management</span>
          </TabsTrigger>
          <TabsTrigger 
            value="members"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Search className="h-4 w-4" />
            <span>Member Search</span>
          </TabsTrigger>
          <TabsTrigger 
            value="maintenance"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Settings className="h-4 w-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger 
            value="email"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Mail className="h-4 w-4" />
            <span>Email Server</span>
          </TabsTrigger>
          <TabsTrigger 
            value="database"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <Database className="h-4 w-4" />
            <span>Database</span>
          </TabsTrigger>
          <TabsTrigger 
            value="standardization"
            className="w-full flex items-center gap-2 justify-start sm:justify-center h-11"
          >
            <FileCheck className="h-4 w-4" />
            <span>Email Standard.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit">
          <Card className="p-4 lg:p-6 glass-card">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gradient">Audit Activity</h2>
            <AuditLogViewer />
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card className="p-4 lg:p-6 glass-card">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gradient">Role Management</h2>
            <RoleManagement />
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card className="p-4 lg:p-6 glass-card">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gradient">Member Search</h2>
            <MemberSearch />
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card className="p-4 lg:p-6 glass-card">
            <h2 className="text-lg lg:text-xl font-semibold mb-4 text-gradient">System Maintenance</h2>
            <MaintenanceManagement />
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card className="p-4 lg:p-6 glass-card">
            <DatabaseManagement />
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <EmailServerDashboard />
        </TabsContent>

        <TabsContent value="standardization">
          <EmailStandardizationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
