
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Filter, Loader2 } from "lucide-react";
import { ReportDateRangePicker } from './reports/ReportDateRangePicker';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Payment } from './types';

export function PaymentArchive() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [paymentType, setPaymentType] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  const { data: archivedPayments, isLoading, error } = useQuery({
    queryKey: ['archivedPayments', dateRange, paymentType],
    queryFn: async () => {
      console.log('Fetching archived payments with filters:', { dateRange, paymentType });
      let query = supabase
        .from('payment_requests')
        .select(`
          *,
          members (
            full_name
          ),
          members_collectors (
            name
          ),
          receipts (
            id,
            receipt_number,
            receipt_url,
            generated_at
          )
        `)
        .eq('status', 'approved')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (paymentType !== 'all') {
        query = query.eq('payment_type', paymentType);
      }

      const { data, error } = await query;
      console.log('Archived payments fetch result:', { data, error });

      if (error) {
        console.error('Error fetching archived payments:', error);
        throw error;
      }
      return data as unknown as Payment[];
    }
  });

  const handleViewReceipt = async (url: string) => {
    try {
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing receipt:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to open receipt. Please try again."
      });
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `receipt-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        variant: "destructive",
        title: "Error downloading receipt",
        description: "Failed to download the receipt. Please try again."
      });
    }
  };

  const handleExport = async () => {
    if (!archivedPayments?.length || exporting) return;

    setExporting(true);
    try {
      console.log('Starting archive export...');
      const csvContent = archivedPayments.map(payment => ({
        date: format(new Date(payment.created_at), 'dd/MM/yyyy'),
        receipt_number: payment.receipts?.[0]?.receipt_number || 'N/A',
        member: payment.members?.full_name,
        amount: payment.amount,
        collector: payment.members_collectors?.name,
        payment_type: payment.payment_type,
        payment_method: payment.payment_method
      }));

      const csv = [
        Object.keys(csvContent[0]).join(','),
        ...csvContent.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-archive-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Payment archive has been exported to CSV"
      });
    } catch (error) {
      console.error('Error exporting archive:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Failed to export payment archive"
      });
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Archive</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Failed to load payment archive'}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold">Payment Archive</h2>
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isLoading || !archivedPayments?.length || exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Archive
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <ReportDateRangePicker onRangeChange={setDateRange} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Type</label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="yearly">Yearly Payment</SelectItem>
                <SelectItem value="emergency">Emergency Collection</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Receipt #</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Collector</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading archived payments...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : !archivedPayments?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No archived payments found for the selected period.
                </TableCell>
              </TableRow>
            ) : (
              archivedPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(new Date(payment.created_at), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{payment.receipts?.[0]?.receipt_number || 'N/A'}</TableCell>
                  <TableCell>{payment.members?.full_name}</TableCell>
                  <TableCell>£{payment.amount.toFixed(2)}</TableCell>
                  <TableCell>{payment.members_collectors?.name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {payment.receipts?.[0]?.receipt_url && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewReceipt(payment.receipts![0].receipt_url)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(payment.receipts![0].receipt_url)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
