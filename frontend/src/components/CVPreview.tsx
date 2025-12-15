import React from 'react';
import jsPDF from 'jspdf';

interface MasterCVEntry {
  id: number;
  user_id: string;
  section_type: string;
  content: string;
  created_at: string;
}

interface CVPreviewProps {
  entries: MasterCVEntry[];
  template?: 'modern' | 'classic' | 'minimal';
}

export const CVPreview: React.FC<CVPreviewProps> = ({ entries, template = 'modern' }) => {
  const grouped = entries.reduce((acc: Record<string, MasterCVEntry[]>, entry) => {
    acc[entry.section_type] = acc[entry.section_type] || [];
    acc[entry.section_type].push(entry);
    return acc;
  }, {});

  const getTemplateClass = () => {
    switch (template) {
      case 'classic': return 'border-l-4 border-blue-500 bg-white shadow-lg';
      case 'minimal': return 'bg-gradient-to-b from-white to-gray-50 border border-gray-200';
      default: return 'bg-white/80 backdrop-blur-md shadow-xl border border-white/20';
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(24);
    doc.text('Your Name', 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(14);
    doc.text('Professional Title', 105, y, { align: 'center' });
    y += 15;

    // Sections
    Object.entries(grouped).forEach(([type, items]) => {
      if (items.length > 0 && type !== 'email' && type !== 'unknown') {
        doc.setFontSize(16);
        doc.text(type.replace('_', ' ').toUpperCase(), 20, y);
        y += 10;
        items.forEach((entry) => {
          doc.setFontSize(12);
          const splitText = doc.splitTextToSize(entry.content, 170);
          doc.text(splitText, 20, y);
          y += splitText.length * 5;
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        });
        y += 5;
      }
    });

    doc.save('resumai-cv.pdf');
  };

  return (
    <div className={`p-8 rounded-2xl max-w-2xl mx-auto print:p-4 print:rounded-none ${getTemplateClass()} print:p-2`}>
      <header className="text-center mb-8 pb-6 border-b-2 border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Name</h1>
        <p className="text-gray-600 text-lg">Professional Title</p>
        {grouped.email?.[0] && <p className="mt-2 text-blue-600">{grouped.email[0].content}</p>}
      </header>

      {Object.entries(grouped).map(([type, items]) => 
        items.length > 0 && type !== 'email' && type !== 'unknown' ? (
          <section key={type} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 capitalize border-b pb-2">{type.replace('_', ' ')}</h2>
            <ul className="space-y-2">
              {items.map((entry, idx) => (
                <li key={idx} className="text-gray-700 leading-relaxed">{entry.content}</li>
              ))}
            </ul>
          </section>
        ) : null
      )}
      
      <button
        onClick={exportToPDF}
        className="no-print mt-6 w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        📄 Export to PDF
      </button>
    </div>
  );
};
