import PropTypes from "prop-types";
import { exportCSV, exportExcel, exportPDF, printTable } from "./TableExport";

const TableExportActions = ({ data, columns, fileName }) => {

  return (
    <div className="d-flex gap-2">

      {/* CSV */}
      <button
        className="btn btn-outline-primary btn-sm"
        title="Export CSV"
        onClick={() => exportCSV(data, columns, fileName)}  
      >
        <i className="fa fa-file-csv"></i>
      </button>

      {/* Excel */}
      <button
        className="btn btn-outline-success btn-sm"
        title="Export Excel"
        onClick={() => exportExcel(data, columns, fileName)}  
      >
        <i className="fa fa-file-excel"></i>
      </button>

      {/* PDF */}
      <button
        className="btn btn-outline-danger btn-sm"
        title="Export PDF"
        onClick={() => exportPDF(data, columns, fileName)}
      >
        <i className="fa fa-file-pdf"></i>
      </button>

      {/* Print */}
      <button
        className="btn btn-outline-dark btn-sm"
        title="Print Table"
        onClick={printTable}
      >
        <i className="fa fa-print"></i>
      </button>

    </div>
  );
};

TableExportActions.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.array,
  fileName: PropTypes.string
};

export default TableExportActions;