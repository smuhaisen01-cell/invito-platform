import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { setSearchQuery } from "../../../../redux/reducer/layout.reducer.js";
import { CiSearch } from "react-icons/ci";

const SearchBarInput = () => {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState("Name");
  const searchQuery = useSelector((state) => state.layout.searchQuery);

  const handleSearch = (e) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleFilterChange = (filterOption) => {
    setFilter(filterOption);
    dispatch(setSearchQuery(""));
  };

  return (
    <div className="search-bar-input-container">
      <div className="search-bar">
        <CiSearch className="search-icon" />
        <input
          type="text"
          placeholder={`Search by ${filter}`}
          value={searchQuery}
          onChange={handleSearch}
          className="search-input"
        />
        <Dropdown onSelect={handleFilterChange} className="filter-dropdown">
          <Dropdown.Toggle className="dropdown-toggle">
            {filter || "Select Filter"}
          </Dropdown.Toggle>
          <Dropdown.Menu className="dropdown-menu">
            <Dropdown.Item eventKey="Name">Name</Dropdown.Item>
            <Dropdown.Item eventKey="Number">Phone No.</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      <style jsx>{`
        .search-bar-input-container {
          position: relative;
          width: 100%;
          max-width: 350px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .search-bar:hover,
        .search-bar:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
        }

        .search-icon {
          font-size: 18px;
          color: #64748b;
          margin-right: 8px;
        }

        .search-input {
          border: none;
          outline: none;
          font-size: 14px;
          color: #1e293b;
          width: 60%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: transparent;
        }

        .search-input::placeholder {
          color: #94a3b8;
          font-size: 14px;
        }

        .filter-dropdown {
          margin-left: auto;
        }

        .dropdown-toggle {
          background: #f1f5f9;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #1e293b;
          padding: 4px 12px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: background 0.2s;
        }

        .dropdown-toggle:hover {
          background: #e2e8f0;
        }

        .dropdown-toggle::after {
          border-top-color: #64748b;
        }

        .dropdown-menu {
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          margin-top: 4px;
          font-size: 13px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .dropdown-item {
          padding: 8px 16px;
          color: #1e293b;
        }

        .dropdown-item:hover {
          background: #f1f5f9;
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default SearchBarInput;