import React from "react";
import { CiSearch } from "react-icons/ci";

const SearchBar = ({ setSearchQuery, searchQuery }) => {
  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <CiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search Table"
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          className="search-input"
        />
      </div>

      <style jsx>{`
        .search-bar-container {
          position: relative;
          width: 100%;
          max-width: 300px;
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
          width: 100%;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: transparent;
        }

        .search-input::placeholder {
          color: #94a3b8;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default SearchBar;