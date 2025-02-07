
import React from 'react';
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
import { Eye, Download, Filter } from "lucide-react";
import type { Payment } from './types';

export function PaymentArchive() {
  const { data: archivedPayments, isLoading } = useQuery({
    queryKey: ['archivedPayments'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Payment[];
    }
  });

  const handleViewReceipt = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Payment Archive</h2>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
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
              <TableCell colSpan={6} className="text-center">Loading archived payments...</TableCell>
            </TableRow>
          ) : archivedPayments?.map((payment) => (
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
                        onClick={() => handleViewReceipt(payment.receipts![0].receipt_url)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
