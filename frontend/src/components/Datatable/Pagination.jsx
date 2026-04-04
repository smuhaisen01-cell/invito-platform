import React from "react";
import PropTypes from "prop-types";
import { Dropdown } from "react-bootstrap";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";

const Pagination = ({
  setItemsPerPage,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  totalPages,
  totalItems
}) => {
  const onItemsPerPageChange = (eventKey) => {
    setItemsPerPage(parseInt(eventKey));
    setCurrentPage(1); 
  };

  const onPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const onNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center gap-2 w-100">
      <div className="w-100">
        <div className="d-flex p-1 justify-content-between align-items-center gap-2 custom-dropdowns end-0">
          <div>
            <span style={{ fontSize: "10px" }}>Show</span>
            <Dropdown
              onSelect={onItemsPerPageChange}
              style={{ display: "inline-block" }}
            >
              <Dropdown.Toggle
                variant="light"
                size="sm"
                className="custom-dropdown-toggle d-flex align-items-center"
              >
                {itemsPerPage}
              </Dropdown.Toggle>
              <Dropdown.Menu className="custom-dropdown-menu text-bg-white">
                <Dropdown.Item eventKey="10">10</Dropdown.Item>
                <Dropdown.Item eventKey="50">50</Dropdown.Item>
                <Dropdown.Item eventKey="100">100</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <span style={{ fontSize: "10px" }}>
              Entries (Total: {totalItems})
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={onPreviousPage}
              className="btn btn-sm text-black border-0"
              disabled={currentPage === 1}
            >
              <MdKeyboardDoubleArrowLeft className="mb-1" /> Previous
            </button>
            
            {/* Optional: Display individual page numbers */}
            {/* {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-light'}`}
                style={{ minWidth: '32px' }}
              >
                {page}
              </button>
            ))} */}
            
            <span style={{ fontSize: "12px" }}>
              {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={onNextPage}
              className="btn btn-sm btn-white text-black border-0"
              disabled={currentPage === totalPages}
            >
              Next <MdKeyboardDoubleArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  itemsPerPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  setCurrentPage: PropTypes.func.isRequired,
  setItemsPerPage: PropTypes.func.isRequired,
};

export default Pagination;
