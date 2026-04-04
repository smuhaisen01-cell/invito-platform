import React, { useState, useEffect } from "react";
import Pagination from "./Pagination";
import SearchBar from "../SearchBar/SearchBar";
import { BiSolidDownload } from "react-icons/bi";
import { FaCircle, FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import Avatar from "react-avatar";
import { debounce } from "lodash";
import { ToastContainer } from "react-toastify";
import "./Datatable.css";

const Table = ({
  columns = [],
  TableData = [],
  isDoubleClick,
  sortConfig,
  handleSort,
  myClass,
  pagination,
  generatePDFs,
  refe,
  generatePDFCondition,
  isSearchBar,
  isRetrieved = true,
  headingDataOnTable,
  TableButton,
}) => {
  const [filterData, setFilterData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCheckAll, setIsCheckAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and update filterData when TableData changes
  useEffect(() => {
    const debouncedSearch = debounce(() => {
      const originalData = Array.isArray(TableData) ? TableData : [];

      if (!searchQuery) {
        setFilterData(originalData);
      } else {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = originalData.filter((item) =>
          item &&
          Object.values(item).some((val) =>
            val?.toString().toLowerCase().includes(lowerQuery)
          )
        );
        setFilterData(filtered);
      }
    }, 300);

    debouncedSearch();

    return () => debouncedSearch.cancel();
  }, [searchQuery, TableData]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = Array.isArray(filterData)
    ? filterData.slice(indexOfFirstItem, indexOfLastItem)
    : [];
  const totalPages = Math.ceil((filterData?.length || 0) / itemsPerPage);

  const handleCheckAll = () => {
    if (Array.isArray(TableData)) {
      setSelectedRows(isCheckAll ? [] : TableData.map((row) => row.id));
      setIsCheckAll(!isCheckAll);
    }
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key)
      return <FaSort className="sort-icon" />;
    return sortConfig.direction === "ascending" ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((row) => row !== id) : [...prev, id]
    );
  };

  const showTable = currentItems.length > 0 && isRetrieved;

  return (
    <div className="table-container">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        theme="colored"
        style={{ zIndex: 9999 }}
      />

      {/* Header */}
      <div className="table-header">
        <div className="header-left">
          <h1 style={{fontWeight:"700"}} className="table-title ">
            {headingDataOnTable || "Data Table"}
          </h1>
          <span className="record-count">
            {filterData.length} records
          </span>
        </div>

        <div className="header-actions">
          {isSearchBar && (
            <div className="search-wrapper">
              <SearchBar setSearchQuery={setSearchQuery} searchQuery={searchQuery} />
            </div>
          )}

          {TableButton && (
            <div className="button-wrapper">
              {TableButton}
            </div>
          )}

          {generatePDFCondition && (
            <button className="export-btn" onClick={generatePDFs}>
              <BiSolidDownload className="btn-icon" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      {!showTable ? (
        <div className="no-data">
          <div className="no-data-content">
            <svg
              className="no-data-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3>No Records Found</h3>
            <p>There are no records to display at the moment.</p>
          </div>
        </div>
      ) : (
        <div className="table-wrapper">
          <div className="table-scroll">
            <table className={`data-table ${myClass ? "hoverable" : ""}`} ref={refe}>
              <thead className="table-head">
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={index}
                      className={`table-th ${
                        handleSort && col.key !== "checkbox" ? "sortable" : ""
                      }`}
                      onClick={() =>
                        handleSort && col.key !== "checkbox" && handleSort(col.key)
                      }
                    >
                      {col.key === "checkbox" ? (
                        <div className="checkbox-container">
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={
                              selectedRows.length === TableData.length &&
                              TableData.length > 0
                            }
                            onChange={handleCheckAll}
                          />
                        </div>
                      ) : (
                        <div className="th-content">
                          <span>{col.label}</span>
                          {handleSort && col.key && getSortIcon(col.key)}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="table-body">
                {isLoading
                  ? Array.from({ length: currentItems.length || 5 }).map((_, index) => (
                      <tr key={index} className="skeleton-row">
                        {columns.map((_, i) => (
                          <td key={i} className="table-td">
                            <div className="skeleton"></div>
                          </td>
                        ))}
                      </tr>
                    ))
                  : currentItems.map((row, indx) => (
                      <tr
                        key={indx}
                        className={`table-row ${
                          selectedRows.includes(row.id) ? "selected" : ""
                        } ${isDoubleClick ? "clickable" : ""}`}
                        {...(isDoubleClick && {
                          onDoubleClick: () => isDoubleClick(row),
                        })}
                      >
                        {columns.map((col, colIndex) => (
                          <td key={colIndex} className="table-td">
                            {col.render ? (
                              col.render(row)
                            ) : col.key === "checkbox" ? (
                              <div className="checkbox-container">
                                <input
                                  type="checkbox"
                                  className="checkbox"
                                  checked={selectedRows.includes(row.id)}
                                  onChange={() => handleRowSelect(row.id)}
                                />
                              </div>
                            ) : col.key === "status" ? (
                              <span className={`status status-${row[col.key]?.toLowerCase()}`}>
                                <FaCircle className="status-dot" />
                                {row[col.key]}
                              </span>
                            ) : col.key === "name" ? (
                              <div className="name-cell">
                                <Avatar
                                  name={row[col.key]}
                                  size="32"
                                  round={true}
                                  className="avatar"
                                />
                                <span>{row[col.key]}</span>
                              </div>
                            ) : (
                              <span>{row[col.key]}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && filterData.length > 0 && (
        <div className="pagination-container">
          <Pagination
            itemsPerPage={itemsPerPage}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            setItemsPerPage={setItemsPerPage}
            totalPages={totalPages}
            totalItems={filterData.length}
          />
        </div>
      )}

      <style jsx>{`
        .table-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .table-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .record-count {
          font-size: 14px;
          color: #6b7280;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .export-btn:hover {
          background: #2563eb;
        }

        .btn-icon {
          font-size: 16px;
        }

        .no-data {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px 20px;
        }

        .no-data-content {
          text-align: center;
          color: #6b7280;
        }

        .no-data-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          color: #d1d5db;
        }

        .no-data-content h3 {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px;
        }

        .no-data-content p {
          font-size: 14px;
          margin: 0;
        }

        .table-wrapper {
          overflow: hidden;
        }

        .table-scroll {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        .table-head {
          background: #f9fafb;
        }

        .table-th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-th.sortable {
          cursor: pointer;
          user-select: none;
        }

        .table-th.sortable:hover {
          background: #f3f4f6;
        }

        .th-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sort-icon {
          font-size: 10px;
          color: #9ca3af;
        }

        .sort-icon.active {
          color: #3b82f6;
        }

        .table-body {
          background: white;
        }

        .table-row {
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s;
        }

        .table-row:hover {
          background: #f9fafb;
        }

        .table-row.selected {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .table-row.clickable {
          cursor: pointer;
        }

        .table-td {
          padding: 12px 16px;
          font-size: 14px;
          color: #374151;
          vertical-align: middle;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox {
          width: 16px;
          height: 16px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
        }

        .checkbox:checked {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .status-dot {
          font-size: 8px;
        }

        .status-approved {
          background: #dcfce7;
          color: #166534;
        }

        .status-rejected {
          background: #fef2f2;
          color: #991b1b;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-active {
          background: #dbeafe;
          color: #1e40af;
        }

        .name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .skeleton-row {
          animation: pulse 1.5s ease-in-out infinite;
        }

        .skeleton {
          height: 16px;
          background: #e5e7eb;
          border-radius: 4px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .pagination-container {
          padding: 16px 24px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .table-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 16px 20px;
          }

          .header-actions {
            justify-content: space-between;
          }

          .table-th,
          .table-td {
            padding: 8px 12px;
          }

          .name-cell {
            gap: 8px;
          }

          .avatar {
            width: 24px !important;
            height: 24px !important;
          }
        }

        @media (max-width: 480px) {
          .table-container {
            border-radius: 8px;
          }

          .table-header {
            padding: 12px 16px;
          }

          .table-title {
            font-size: 18px;
          }

          .header-actions {
            flex-direction: column;
            gap: 8px;
          }

          .table-th,
          .table-td {
            padding: 6px 8px;
          }

          .pagination-container {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default Table;
