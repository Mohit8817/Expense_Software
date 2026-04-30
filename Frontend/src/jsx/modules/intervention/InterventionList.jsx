import React, { useEffect, useState } from "react";
import { Col, Card, Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter"; 

const InterventionList = () => {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(false);

 
  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(interventions, {
    keys: ["name", "status"],
    itemsPerPage: 10,
  });

  // FETCH DATA
  const fetchInterventions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}interventions/get-interventions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setInterventions(data);
    } catch (error) {
      console.error(error);
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete this intervention?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}interventions/delete-intervention/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Deleted successfully");
      fetchInterventions();
    } catch (error) {
      console.error(error);
      alert("Delete failed");
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, []);

  const columns = [
    { label: "Intervention", key: "name" },
    { label: "Status", key: "status" },
  ];

  return (
    <>
      <PageTitle activeMenu="Intervention List" motherMenu="Intervention" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Intervention List</Card.Title>

            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search interventions..."
              />
              <TableExportActions
                data={interventions}
                columns={columns}
                fileName="Intervention_List"
              />
            </div>
          </Card.Header>

          <Card.Body>
            {loading ? (
              <p className="text-center">Loading...</p>
            ) : (
              <Table responsive className="text-nowrap">
                <thead>
                  <tr>
                    <th>Sno</th>
                    <th>Intervention</th>
                    <th>Status</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>

                <tbody>
                 
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <tr key={item.id}>
                      
                        <td>{indexOfFirst + index + 1}</td>
                        <td>{item.name}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <i
                              className={`fa fa-circle me-1 ${
                                item.status ? "text-success" : "text-danger"
                              }`}
                            ></i>
                            {item.status ? "Active" : "Inactive"}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <Link
                              to={`/intervention-form?id=${item.id}`}
                              className="btn btn-primary shadow btn-xs sharp"
                              title="Edit"
                            >
                              <i className="fas fa-pencil-alt"></i>
                            </Link>
                            <button
                              className="btn btn-danger shadow btn-xs sharp"
                              onClick={() => handleDelete(item.id)}
                              title="Delete"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No interventions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}

         
            <Pagination
              totalItems={totalItems}
              itemsPerPage={100}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default InterventionList;