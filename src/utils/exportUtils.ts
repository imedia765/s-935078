import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (data: any[], filename: string) => {
  const headers = ['Member Number', 'Full Name', 'Email', 'Phone', 'Collector', 'Status'];
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.member_number,
      row.full_name,
      row.email,
      row.phone || 'N/A',
      row.members_collectors?.name || 'No Collector',
      row.status || 'Unknown'
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

const addPageHeader = (doc: jsPDF, text: string) => {
  doc.setFillColor(155, 135, 245); // Light purple background
  doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
  doc.setTextColor(255, 255, 255); // White text
  doc.setFontSize(20);
  doc.text(text, 14, 20);
  doc.setTextColor(0, 0, 0); // Reset text color to black
  doc.setFontSize(11);
};

const addCollectorHeader = (doc: jsPDF, collectorName: string, yPosition: number) => {
  doc.setFillColor(211, 228, 253); // Soft blue background
  doc.rect(10, yPosition - 6, doc.internal.pageSize.width - 20, 10, 'F');
  doc.setFontSize(12);
  doc.setTextColor(34, 34, 34); // Dark gray text
  doc.text(`Collector: ${collectorName}`, 14, yPosition);
  doc.setFontSize(11);
};

export const generatePDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  addPageHeader(doc, title);
  
  // Group members by collector
  const groupedMembers = data.reduce((acc: any, member: any) => {
    const collectorName = member.members_collectors?.name || 'No Collector';
    if (!acc[collectorName]) {
      acc[collectorName] = [];
    }
    acc[collectorName].push(member);
    return acc;
  }, {});

  let yPosition = 40;
  
  Object.entries(groupedMembers).forEach(([collectorName, members]: [string, any[]], index) => {
    if (index > 0) {
      doc.addPage();
      addPageHeader(doc, title);
      yPosition = 40;
    }

    addCollectorHeader(doc, collectorName, yPosition);
    
    autoTable(doc, {
      head: [['Member Number', 'Full Name', 'Email', 'Phone', 'Status']],
      body: members.map((member: any) => [
        member.member_number,
        member.full_name,
        member.email,
        member.phone || 'N/A',
        member.status || 'Unknown'
      ]),
      startY: yPosition + 10,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [140, 93, 211], // Primary purple
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [242, 242, 242], // Light gray for alternate rows
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  });

  doc.save(`${title}.pdf`);
};

export const generateIndividualMemberPDF = (member: any) => {
  const doc = new jsPDF();
  
  // Header
  addPageHeader(doc, 'Member Details Report');
  
  // Member information box
  doc.setFillColor(242, 252, 226); // Soft green background
  doc.rect(14, 40, doc.internal.pageSize.width - 28, 100, 'F');
  
  // Member details
  doc.setFontSize(12);
  const details = [
    ['Member Number:', member.member_number],
    ['Full Name:', member.full_name],
    ['Email:', member.email],
    ['Phone:', member.phone || 'N/A'],
    ['Collector:', member.members_collectors?.name || 'No Collector'],
    ['Status:', member.status || 'Unknown'],
  ];

  let yPos = 55;
  details.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(value, 100, yPos);
    yPos += 15;
  });

  // Add status indicator
  const statusColor = member.status === 'active' ? [34, 197, 94] : [156, 163, 175];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.circle(180, 55, 5, 'F');

  doc.save(`member_${member.member_number}_report.pdf`);
};
