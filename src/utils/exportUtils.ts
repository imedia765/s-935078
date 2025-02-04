import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToCSV = (data: any[], filename: string) => {
  const headers = [
    'Member Number',
    'Full Name',
    'Email',
    'Phone',
    'Address',
    'Status',
    'Registration Date',
    'Last Payment Date',
    'Total Payments',
    'Payment Status',
    'Family Members',
    'Notes'
  ];

  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.member_number,
      row.full_name,
      row.email,
      row.phone || 'N/A',
      row.address || 'N/A',
      row.status || 'Unknown',
      new Date(row.created_at).toLocaleDateString(),
      row.last_payment_date ? new Date(row.last_payment_date).toLocaleDateString() : 'N/A',
      row.payment_requests?.length || 0,
      row.payment_status || 'N/A',
      (row.family_members || []).map((fm: any) => `${fm.full_name} (${fm.relationship})`).join('; '),
      row.notes || 'N/A'
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

export const generatePDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFillColor(155, 135, 245);
  doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(title, 14, 20);
  
  // Reset text color and font size
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  const tableData = data.map(member => ({
    memberInfo: {
      number: member.member_number,
      name: member.full_name,
      contact: `${member.email}\n${member.phone || 'No phone'}\n${member.address || 'No address'}`,
      status: member.status,
      registration: new Date(member.created_at).toLocaleDateString()
    },
    payments: {
      total: member.payment_requests?.length || 0,
      lastPayment: member.last_payment_date ? new Date(member.last_payment_date).toLocaleDateString() : 'N/A',
      status: member.payment_status || 'N/A'
    },
    family: (member.family_members || []).map((fm: any) => 
      `${fm.full_name} (${fm.relationship})`
    ).join('\n'),
    notes: member.notes || 'N/A'
  }));

  let yPosition = 40;
  
  tableData.forEach((member, index) => {
    if (index > 0 && yPosition > doc.internal.pageSize.height - 60) {
      doc.addPage();
      yPosition = 20;
    }

    autoTable(doc, {
      startY: yPosition,
      head: [['Member Information', 'Payment Details', 'Family Members', 'Notes']],
      body: [[
        `Number: ${member.memberInfo.number}\n` +
        `Name: ${member.memberInfo.name}\n` +
        `Contact: ${member.memberInfo.contact}\n` +
        `Status: ${member.memberInfo.status}\n` +
        `Registered: ${member.memberInfo.registration}`,
        
        `Total Payments: ${member.payments.total}\n` +
        `Last Payment: ${member.payments.lastPayment}\n` +
        `Status: ${member.payments.status}`,
        
        member.family,
        member.notes
      ]],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' }
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`${title}.pdf`);
};

export const exportToExcel = (data: any[], filename: string) => {
  const workbook = XLSX.utils.book_new();
  
  const processedData = data.map(member => ({
    'Member Number': member.member_number,
    'Full Name': member.full_name,
    'Email': member.email,
    'Phone': member.phone || 'N/A',
    'Address': member.address || 'N/A',
    'Status': member.status || 'Unknown',
    'Registration Date': new Date(member.created_at).toLocaleDateString(),
    'Last Payment Date': member.last_payment_date ? new Date(member.last_payment_date).toLocaleDateString() : 'N/A',
    'Total Payments': member.payment_requests?.length || 0,
    'Payment Status': member.payment_status || 'N/A',
    'Family Members': (member.family_members || []).map((fm: any) => `${fm.full_name} (${fm.relationship})`).join('; '),
    'Notes': member.notes || 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(processedData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};