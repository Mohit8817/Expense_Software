// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// /* ================= CSV EXPORT ================= */
// export const exportCSV = (data, fileName = "table-data") => {
//   const worksheet = XLSX.utils.json_to_sheet(data);
//   const workbook = XLSX.utils.book_new();

//   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
//   XLSX.writeFile(workbook, `${fileName}.csv`);
// };

// /* ================= EXCEL EXPORT ================= */
// export const exportExcel = (data, fileName = "table-data") => {
//   const worksheet = XLSX.utils.json_to_sheet(data);
//   const workbook = XLSX.utils.book_new();

//   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
//   XLSX.writeFile(workbook, `${fileName}.xlsx`);
// };

// /* ================= PDF EXPORT ================= */
// export const exportPDF = (data, columns, fileName = "table-data") => {
//   const doc = new jsPDF("landscape");

//   const tableColumn = columns.map(col => col.label);
//   const tableRows = data.map(row =>
//     columns.map(col => row[col.key] ?? "")
//   );

//   doc.setFontSize(14);
//   doc.text(fileName, 14, 15);

//   autoTable(doc, {
//     head: [tableColumn],
//     body: tableRows,
//     startY: 25,
//     styles: { fontSize: 9 },
//     headStyles: { fillColor: [40, 167, 69] }
//   });

//   doc.save(`${fileName}.pdf`);
// };

// /* ================= PRINT ================= */
// export const printTable = () => {
//   window.print();
// };


import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= CSV EXPORT ================= */
export const exportCSV = (data, columns, fileName = "table-data") => {
  // Filter and rename keys based on columns
  const filteredData = data.map((row) =>
    Object.fromEntries(columns.map((col) => [col.label, row[col.key] ?? ""]))
  );

  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.csv`);
};

/* ================= EXCEL EXPORT ================= */
export const exportExcel = (data, columns, fileName = "table-data") => {
  // Filter and rename keys based on columns
  const filteredData = data.map((row) =>
    Object.fromEntries(columns.map((col) => [col.label, row[col.key] ?? ""]))
  );

  const worksheet = XLSX.utils.json_to_sheet(filteredData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/* ================= PDF EXPORT ================= */
export const exportPDF = (data, columns, fileName = "table-data") => {
  const doc = new jsPDF("landscape");

  const tableColumn = columns.map((col) => col.label);
  const tableRows = data.map((row) =>
    columns.map((col) => row[col.key] ?? "")
  );

  doc.setFontSize(14);
  doc.text(fileName, 14, 15);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [40, 167, 69] },
  });

  doc.save(`${fileName}.pdf`);
};

/* ================= PRINT ================= */
export const printTable = () => {
  window.print();
};