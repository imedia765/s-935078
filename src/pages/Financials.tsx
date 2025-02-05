
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { FinancialOverview } from "@/components/admin/financial/FinancialOverview";
import { PaymentsList } from "@/components/admin/financial/PaymentsList";
import { FinancialReports } from "@/components/admin/financial/FinancialReports";
import { MemberStats } from "@/components/admin/financial/MemberStats";

export default function Financials() {
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gradient">Financial Management</h1>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="w-full justify-start bg-black/40 backdrop-blur-xl border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="stats">Member Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-6 glass-card">
            <FinancialOverview />
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="p-6 glass-card">
            <PaymentsList />
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="p-6 glass-card">
            <FinancialReports />
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card className="p-6 glass-card">
            <MemberStats />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
