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
      head: [['Member Number', 'Full Name', 'Contact Info', 'Type', 'Status', 'Last Payment']],
      body: members.map((member: any) => [
        member.member_number,
        `${member.full_name}\n${member.date_of_birth || 'DOB: N/A'}`,
        `${member.email}\n${member.phone || 'No phone'}\n${member.address || 'No address'}`,
        member.membership_type || 'Standard',
        member.status || 'Unknown',
        member.payment_date || 'No payment recorded'
      ]),
      startY: yPosition + 10,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak',
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: [140, 93, 211],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [242, 242, 242],
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 20;
  });

  doc.save(`${title}.pdf`);
};

export const generateIndividualMemberPDF = (member: any) => {
  const doc = new jsPDF();
  addPageHeader(doc, 'Member Details Report');
  
  // Member information box
  doc.setFillColor(242, 252, 226);
  doc.rect(14, 40, doc.internal.pageSize.width - 28, 140, 'F');
  
  // Member details
  doc.setFontSize(12);
  const details = [
    ['Member Number:', member.member_number],
    ['Full Name:', member.full_name],
    ['Email:', member.email],
    ['Phone:', member.phone || 'N/A'],
    ['Address:', member.address || 'N/A'],
    ['Date of Birth:', member.date_of_birth || 'N/A'],
    ['Membership Type:', member.membership_type || 'Standard'],
    ['Collector:', member.members_collectors?.name || 'No Collector'],
    ['Status:', member.status || 'Unknown'],
    ['Last Payment:', member.payment_date || 'No payment recorded']
  ];

  let yPos = 55;
  details.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(value, 100, yPos);
    yPos += 12;
  });

  // Add status indicator
  const statusColor = member.status === 'active' ? [34, 197, 94] : [156, 163, 175];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.circle(180, 55, 5, 'F');

  // Add family members section if available
  if (member.family_members && member.family_members.length > 0) {
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Family Members:', 20, yPos);
    yPos += 10;
    
    member.family_members.forEach((familyMember: any) => {
      doc.setFont(undefined, 'normal');
      doc.text(`${familyMember.relationship}: ${familyMember.full_name}`, 30, yPos);
      yPos += 8;
    });
  }

  // Add notes section if available
  if (member.member_notes && member.member_notes.length > 0) {
    yPos += 10;
    doc.setFont(undefined, 'bold');
    doc.text('Notes:', 20, yPos);
    yPos += 10;
    
    member.member_notes.forEach((note: any) => {
      doc.setFont(undefined, 'normal');
      doc.text(`${note.note_type}: ${note.note_text}`, 30, yPos);
      yPos += 8;
    });
  }

  doc.save(`member_${member.member_number}_report.pdf`);
};