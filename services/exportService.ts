/**
 * Servicio de Exportación de Reportes
 * Genera PDF y Excel desde datos del CRM
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  filename: string;
}

/**
 * Exportar a PDF
 */
export const exportToPDF = (options: ExportOptions): void => {
  const { title, subtitle, columns, data, filename } = options;

  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 14, 22);

  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 30);
  }

  // Fecha de generación
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, subtitle ? 38 : 30);

  // Tabla
  const tableData = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '-';
      if (typeof value === 'number') return value.toLocaleString('es-MX');
      if (value instanceof Date) return value.toLocaleDateString('es-MX');
      return String(value);
    })
  );

  autoTable(doc, {
    head: [columns.map(c => c.header)],
    body: tableData,
    startY: subtitle ? 45 : 38,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Footer con número de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount} - Expendio CRM`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`${filename}.pdf`);
};

/**
 * Exportar a Excel
 */
export const exportToExcel = (options: ExportOptions): void => {
  const { title, columns, data, filename } = options;

  // Preparar datos con headers
  const worksheetData = [
    [title],
    [`Generado: ${new Date().toLocaleString('es-MX')}`],
    [], // Fila vacía
    columns.map(c => c.header),
    ...data.map(row => columns.map(col => {
      const value = row[col.key];
      if (value === null || value === undefined) return '';
      return value;
    }))
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Ajustar anchos de columna
  worksheet['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

  // Merge para título
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Configuraciones predefinidas para reportes comunes
 */
export const ReportConfigs = {
  ventas: {
    title: 'Reporte de Ventas',
    columns: [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Mesa', key: 'mesa', width: 10 },
      { header: 'Cliente', key: 'cliente', width: 20 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Método Pago', key: 'metodo_pago', width: 15 },
    ],
  },

  reservas: {
    title: 'Reporte de Reservas',
    columns: [
      { header: 'Fecha/Hora', key: 'fecha_hora', width: 18 },
      { header: 'Cliente', key: 'cliente', width: 20 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Mesa', key: 'mesa', width: 10 },
      { header: 'Personas', key: 'personas', width: 10 },
      { header: 'Estado', key: 'estado', width: 12 },
    ],
  },

  clientes: {
    title: 'Reporte de Clientes',
    columns: [
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Visitas', key: 'visitas', width: 10 },
      { header: 'Puntos', key: 'puntos', width: 10 },
      { header: 'Total Gastado', key: 'total_gastado', width: 15 },
    ],
  },

  productos: {
    title: 'Reporte de Productos Vendidos',
    columns: [
      { header: 'Producto', key: 'nombre', width: 25 },
      { header: 'Categoría', key: 'categoria', width: 15 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Precio Unit.', key: 'precio', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
    ],
  },
};
