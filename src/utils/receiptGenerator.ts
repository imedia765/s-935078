
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/components/admin/financial/types';
import { format } from 'date-fns';

export async function generateReceipt(payment: Payment): Promise<Blob> {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(20);
  doc.text('Payment Receipt', 105, 20, { align: 'center' });
  
  // Add logo if exists
  // TODO: Add organization logo
  
  // Add payment details
  doc.setFontSize(12);
  const startY = 40;
  
  autoTable(doc, {
    startY: startY,
    head: [['Details', 'Value']],
    body: [
      ['Receipt Number', payment.payment_number],
      ['Date', format(new Date(payment.created_at), 'dd/MM/yyyy')],
      ['Member Name', payment.members?.full_name || 'N/A'],
      ['Amount', `£${payment.amount.toFixed(2)}`],
      ['Payment Method', payment.payment_method],
      ['Payment Type', payment.payment_type],
      ['Status', payment.status],
      ['Collector', payment.members_collectors?.name || 'N/A']
    ],
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 66, 66] }
  });
  
  // Add footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.text('This is an electronically generated receipt.', 105, pageHeight - 20, { align: 'center' });
  
  return doc.output('blob');
}

export async function saveReceiptToStorage(paymentId: string, receiptBlob: Blob): Promise<string> {
  const fileName = `receipts/${paymentId}-${Date.now()}.pdf`;
  
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(fileName, receiptBlob, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);
    
  return publicUrl;
}
