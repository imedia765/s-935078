
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("roles");

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold mb-6 text-gradient">Admin Dashboard</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="w-full lg:w-auto inline-flex justify-start bg-black/40 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="roles">Role Management</TabsTrigger>
            <TabsTrigger value="members">Member Search</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="email">Email Server</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="standardization">Email Standard.</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

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
