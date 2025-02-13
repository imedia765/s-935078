
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
  
  // Calculate center positions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const centerX = pageWidth / 2;
  
  // Add organization name and logo
  doc.setTextColor(66, 66, 66);
  doc.text('Organization Name', centerX, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text('Payment Receipt', centerX, 30, { align: 'center' });
  
  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 35, pageWidth - 20, 35);
  
  // Add receipt details
  const startY = 45;
  
  // Add receipt number and date header
  const receiptNumber = await generateReceiptNumber();
  doc.setFontSize(10);
  doc.text(`Receipt #: ${receiptNumber}`, 20, startY);
  doc.text(`Date: ${format(new Date(payment.created_at), 'dd/MM/yyyy')}`, pageWidth - 20, startY, { align: 'right' });
  
  // Format payment method safely
  const formattedPaymentMethod = payment.payment_method 
    ? payment.payment_method.toString().replace(/_/g, ' ').toUpperCase()
    : 'N/A';

  // Add payment details table
  autoTable(doc, {
    startY: startY + 10,
    margin: { left: 20, right: 20 },
    head: [['Details', 'Value']],
    body: [
      ['Payment Number', payment.payment_number || 'N/A'],
      ['Member Name', payment.members?.full_name || 'N/A'],
      ['Amount', payment.amount ? `£${payment.amount.toFixed(2)}` : 'N/A'],
      ['Payment Method', formattedPaymentMethod],
      ['Payment Type', payment.payment_type || 'N/A'],
      ['Status', payment.status ? payment.status.toUpperCase() : 'N/A'],
      ['Collector', payment.members_collectors?.name || 'N/A']
    ],
    theme: 'grid',
    styles: { 
      fontSize: 10,
      cellPadding: 5,
      textColor: [60, 60, 60]
    },
    headStyles: { 
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text('This is an electronically generated receipt.', centerX, pageHeight - 20, { align: 'center' });
  const timestamp = `Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`;
  doc.text(timestamp, centerX, pageHeight - 15, { align: 'center' });
  
  // Save the receipt and get the URL
  const receiptBlob = doc.output('blob');
  await saveReceiptToStorage(payment, receiptBlob);
  
  return receiptBlob;
}

export async function saveReceiptToStorage(payment: Payment, receiptBlob: Blob): Promise<string> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Generate unique receipt number
  const receiptNumber = await generateReceiptNumber();
  
  try {
    // Save to storage
    const fileName = `${payment.payment_number}/${receiptNumber}.pdf`;
    const { data: storageData, error: storageError } = await supabase.storage
      .from('receipts')
      .upload(fileName, receiptBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (storageError) {
      console.error('Storage error:', storageError);
      throw storageError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    // Create metadata object
    const metadata: ReceiptMetadata = {
      receipt_number: receiptNumber,
      receipt_url: publicUrl,
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      payment_number: payment.payment_number,
      member_name: payment.members?.full_name,
      amount: payment.amount
    };

    // Update payment record with metadata
    const { error: updateError } = await supabase
      .from('payment_requests')
      .update({ receipt_metadata: metadata })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Metadata update error:', updateError);
      throw updateError;
    }
      
    return publicUrl;
  } catch (error) {
    console.error('Receipt storage error:', error);
    throw error;
  }
}

export async function getPaymentReceipt(paymentId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('receipt_metadata')
    .eq('id', paymentId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.receipt_metadata) return null;
  
  const metadata = data.receipt_metadata as unknown as ReceiptMetadata;
  return metadata.receipt_url;
}
