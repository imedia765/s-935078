
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

export const generatePDF = (data: any[], title: string, exportType: 'all-collectors' | 'collector' | 'detailed-member' = 'collector') => {
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

  let yPosition = 40;

  if (exportType === 'detailed-member') {
    const member = data[0];
    
    // Member Information
    autoTable(doc, {
      startY: yPosition,
      head: [['Member Information']],
      body: Object.entries(member.memberInfo).map(([key, value]) => [
        `${key.replace(/_/g, ' ').toUpperCase()}: ${value || 'N/A'}`
      ]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Family Members
    if (member.familyMembers.length > 0) {
      autoTable(doc, {
        startY: yPosition,
        head: [['Family Members']],
        body: member.familyMembers.map((fm: any) => [
          `${fm.full_name} (${fm.relationship}) - ${fm.gender || 'N/A'} - DOB: ${fm.date_of_birth || 'N/A'}`
        ]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Payment History
    autoTable(doc, {
      startY: yPosition,
      head: [['Payment Date', 'Amount', 'Status', 'Method', 'Reference']],
      body: member.paymentHistory.map((payment: any) => [
        payment.created_at,
        payment.amount ? `£${payment.amount.toFixed(2)}` : '£0.00',
        payment.status,
        payment.payment_method,
        payment.payment_number
      ]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Payment Summary
    autoTable(doc, {
      startY: yPosition,
      head: [['Payment Summary']],
      body: Object.entries(member.paymentSummary).map(([key, value]) => [
        `${key.replace(/_/g, ' ').toUpperCase()}: ${
          key.includes('amount') ? (value ? `£${Number(value).toFixed(2)}` : '£0.00') : value
        }`
      ]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 }
    });
  } else if (exportType === 'all-collectors') {
    data.forEach((collector, index) => {
      if (index > 0) {
        doc.addPage();
        yPosition = 40;
      }

      // Collector Summary
      autoTable(doc, {
        startY: yPosition,
        head: [['Collector Information']],
        body: [
          [`Name: ${collector.collector_name}`],
          [`Email: ${collector.collector_email}`],
          [`Phone: ${collector.collector_phone}`],
          [`Total Members: ${collector.total_members}`],
          [`Total Payments: ${collector.total_payments}`],
          [`Total Amount: £${(collector.total_amount || 0).toFixed(2)}`]
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      // Members Table
      autoTable(doc, {
        startY: yPosition,
        head: [['Member', 'Contact', 'Status', 'Payments', 'Amount']],
        body: collector.members.map((member: any) => [
          `${member.full_name}\n${member.member_number}`,
          `${member.email}\n${member.phone}`,
          member.status,
          `Total: ${member.payments.total}\nApproved: ${member.payments.approved}\nPending: ${member.payments.pending}`,
          `£${(member.payments.amount || 0).toFixed(2)}`
        ]),
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 }
      });
    });
  } else {
    // Single collector export
    autoTable(doc, {
      startY: yPosition,
      head: [['Member Number', 'Name', 'Contact', 'Status', 'Payments', 'Amount']],
      body: data.map((member) => [
        member.member_number,
        member.full_name,
        `${member.email}\n${member.phone}`,
        member.status,
        `Total: ${member.total_payments}\nApproved: ${member.approved_payments}\nPending: ${member.pending_payments}`,
        `£${(member.total_amount || 0).toFixed(2)}`
      ]),
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 }
    });
  }

  doc.save(`${title}.pdf`);
};

export const generateIndividualMemberPDF = (member: any) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFillColor(155, 135, 245);
  doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(`Member Details: ${member.member_number}`, 14, 20);
  
  // Reset text color and font size
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);

  const memberData = [
    ['Member Information', 'Details'],
    ['Full Name', member.full_name],
    ['Email', member.email],
    ['Phone', member.phone || 'N/A'],
    ['Status', member.status],
    ['Registration Date', new Date(member.created_at).toLocaleDateString()],
    ['Collector', member.members_collectors?.name || 'No Collector'],
    ['Last Payment Date', member.last_payment_date ? new Date(member.last_payment_date).toLocaleDateString() : 'N/A'],
    ['Payment Status', member.payment_status || 'N/A'],
    ['Notes', member.notes || 'N/A']
  ];

  autoTable(doc, {
    startY: 40,
    head: [['Field', 'Value']],
    body: memberData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' }
    }
  });

  // Add family members section if available
  if (member.family_members && member.family_members.length > 0) {
    const familyY = (doc as any).lastAutoTable.finalY + 10;
    doc.text('Family Members', 14, familyY);
    
    const familyData = member.family_members.map((fm: any) => [
      fm.full_name,
      fm.relationship,
      fm.notes || 'N/A'
    ]);

    autoTable(doc, {
      startY: familyY + 5,
      head: [['Name', 'Relationship', 'Notes']],
      body: familyData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 }
    });
  }

  doc.save(`member_${member.member_number}.pdf`);
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
