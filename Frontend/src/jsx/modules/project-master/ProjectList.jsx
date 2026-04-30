import React, { useState, useEffect } from "react";
import { Col, Card, Table } from "react-bootstrap";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useLocation, useNavigate } from "react-router-dom";
import { getAllProjects, deleteProject, getManagers } from "./projectApi";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter"; // ✅ Added

const ProjectMasterList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [managers, setManagers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(projects, {
    keys: [
      "projectName",
      "financialYear",
      "funderName",
      "contactPerson",
      "contactPersonName",
      "projectStatus",
    ],
    itemsPerPage: 100,
  });

  useEffect(() => {
    const fetchManagers = async () => {
      const { ok, result } = await getManagers();
      if (ok) setManagers(result);
    };
    fetchManagers();
  }, []);

  // Helper function
  const getManagerName = (managerId) => {
    const found = managers.find(
      (m) => m.id === managerId || m.id === Number(managerId)
    );
    return found ? found.username : managerId;
  };

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, [location.key]);

  const fetchProjects = async () => {
    try {
      const data = await getAllProjects();
      
      if (!data || !data.data) {
        console.error(data?.message || "Failed to fetch projects");
        return;
      }

      const formattedData = data.data.map((proj) => ({
        id: proj.id,
        projectName: proj.name,
        startDate: proj.start_date
          ? new Date(proj.start_date).toLocaleDateString()
          : "-",
        endDate: proj.end_date
          ? new Date(proj.end_date).toLocaleDateString()
          : "-",
        financialYear: proj.financial_year,
        funderName: proj.funder_name,
        contactPerson: proj.contact_person_number,
        contactPersonName: proj.contact_person,
        projectManager: proj.manager_id,
        projectStatus: proj.status ? "Ongoing" : "Completed",
        mou: proj.mou,
        description: proj.description || "-",
      }));

      setProjects(formattedData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;

    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const data = await deleteProject(id);
      if (data && data.success === false) {
        alert(data.message || "Delete failed");
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting project");
      fetchProjects();
    }
  };

  const columns = [
    { label: "Project Name", key: "projectName" },
    { label: "Start Date", key: "startDate" },
    { label: "End Date", key: "endDate" },
    { label: "Financial Year", key: "financialYear" },
    { label: "Funder Name", key: "funderName" },
    { label: "Contact Person", key: "contactPerson" },
    { label: "Contact Person Name", key: "contactPersonName" },
    { label: "Project Manager", key: "projectManager" },
    { label: "Status", key: "projectStatus" },
  ];

  if (loading) {
    return (
      <>
        <PageTitle activeMenu="Project Master List" motherMenu="Project Master" />
        <div className="text-center mt-5">Loading projects...</div>
      </>
    );
  }

  return (
    <>
      <PageTitle activeMenu="Project Master List" motherMenu="Project Master" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Project Master List</Card.Title>

            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search projects..."
              />

              <TableExportActions
                data={projects}
                columns={columns}
                fileName="Project_Master_List"
              />
            </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Project Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Financial Year</th>
                  <th>Funder</th>
                  <th>Contact</th>
                  <th>Contact Name</th>
                  <th>MOU</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((proj, index) => (
                    <tr key={proj.id}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{proj.projectName}</td>
                      <td>{proj.startDate}</td>
                      <td>{proj.endDate}</td>
                      <td>{proj.financialYear}</td>
                      <td>{proj.funderName}</td>
                      <td>{proj.contactPerson}</td>
                      <td>{proj.contactPersonName}</td>

                      <td>
                        {proj.mou ? (
                          <a
                            href={proj.mou}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-info"
                          >
                            View
                          </a>
                        ) : (
                          <span>No File</span>
                        )}
                      </td>

                      <td>{getManagerName(proj.projectManager)}</td>

                      <td>
                        <div className="d-flex align-items-center">
                          <i
                            className={`fa fa-circle me-1 ${proj.projectStatus === "Ongoing"
                                ? "text-primary"
                                : "text-success"
                              }`}
                          ></i>
                          {proj.projectStatus}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex">
                          <button
                            className="btn btn-primary shadow btn-xs sharp me-1"
                            onClick={() => navigate(`/project-edit/${proj.id}`)}
                          >
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                          <button
                            className="btn btn-danger shadow btn-xs sharp"
                            onClick={() => handleDelete(proj.id)}
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center">
                      No Projects Found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>

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

export default ProjectMasterList;