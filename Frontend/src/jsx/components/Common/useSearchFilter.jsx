import { useState, useMemo, useEffect } from "react";

export const useSearchFilter = (data = [], options = {}) => {
  const { keys = [], itemsPerPage = 10 } = options;

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // FILTER
  const filteredData = useMemo(() => {
    if (!search) return data;

    return data.filter((item) =>
      keys.some((key) =>
        item[key]
          ?.toString()
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [search, data, keys]);

  // RESET PAGE ON SEARCH
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // PAGINATION
  const totalItems = filteredData.length;

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;  

  const paginatedData = filteredData.slice(indexOfFirst, indexOfLast);

  return {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    filteredData,
    indexOfFirst,  
  };
};


export const SearchInput = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <input
      type="text"
      className="form-control w-250"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};