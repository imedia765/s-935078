
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/integrations/supabase/client';
import { Payment, ReceiptMetadata } from '@/components/admin/financial/types';
import { format } from 'date-fns';

async function generateReceiptNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_receipt_number');
  if (error) throw error;
  return data;
}

export async function generateReceipt(payment: Payment): Promise<Blob> {
  const doc = new jsPDF();
  
  // Add header with logo
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
  
  // Save the receipt and get the URL
  const receiptBlob = doc.output('blob');
  const receiptUrl = await saveReceiptToStorage(payment, receiptBlob);
  
  return receiptBlob;
}

export async function saveReceiptToStorage(payment: Payment, receiptBlob: Blob): Promise<string> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Generate unique receipt number
  const receiptNumber = await generateReceiptNumber();
  
  // Save to storage
  const fileName = `${receiptNumber}.pdf`;
  const { data: storageData, error: storageError } = await supabase.storage
    .from('receipts')
    .upload(fileName, receiptBlob, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  if (storageError) throw storageError;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName);

  // Create metadata object as a plain JSON object
  const metadata = {
    receipt_number: receiptNumber,
    receipt_url: publicUrl,
    generated_at: new Date().toISOString(),
    generated_by: user.id,
    payment_number: payment.payment_number,
    member_name: payment.members?.full_name,
    amount: payment.amount
  } as const;

  const { error: updateError } = await supabase
    .from('payment_requests')
    .update({ receipt_metadata: metadata })
    .eq('id', payment.id);

  if (updateError) throw updateError;
    
  return publicUrl;
}

export async function getPaymentReceipt(paymentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('receipt_metadata')
    .eq('id', paymentId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.receipt_metadata) return null;
  
  // First cast to unknown, then to ReceiptMetadata to safely handle the type conversion
  const metadata = data.receipt_metadata as unknown as ReceiptMetadata;
  return metadata.receipt_url;
}
