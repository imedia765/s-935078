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

export const generatePDF = (data: any[], title: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

  // Add table
  autoTable(doc, {
    head: [['Member Number', 'Full Name', 'Email', 'Phone', 'Collector', 'Status']],
    body: data.map(row => [
      row.member_number,
      row.full_name,
      row.email,
      row.phone || 'N/A',
      row.members_collectors?.name || 'No Collector',
      row.status || 'Unknown'
    ]),
    startY: 35,
  });

  doc.save(`${title}.pdf`);
};

export const generateIndividualMemberPDF = (member: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.text('Member Details Report', 14, 15);
  
  // Member information
  doc.setFontSize(12);
  const details = [
    ['Member Number:', member.member_number],
    ['Full Name:', member.full_name],
    ['Email:', member.email],
    ['Phone:', member.phone || 'N/A'],
    ['Collector:', member.members_collectors?.name || 'No Collector'],
    ['Status:', member.status || 'Unknown'],
  ];

  let yPos = 30;
  details.forEach(([label, value]) => {
    doc.text(`${label} ${value}`, 14, yPos);
    yPos += 10;
  });

  doc.save(`member_${member.member_number}_report.pdf`);
};