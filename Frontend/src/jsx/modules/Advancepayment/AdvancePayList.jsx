import React, { useState } from "react";
import { Col, Card, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../layouts/PageTitle";
import TableExportActions from "../../components/Common/TableExportActions";
import Pagination from "../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../components/Common/useSearchFilter";

const STATIC_DATA = [
  {
    id: 1,
    project_name: "Road Repair – Block A",
    company: "BuildCorp Ltd.",
    project_state: "Rajasthan",
    intervention: "Infrastructure",
    requested_amount: 50000,
    manager: "Amit Sharma",
    purpose: "Purchase of raw materials for road repair work in Block A.",
    status: "pending",
  },
  {
    id: 2,
    project_name: "Water Supply – Zone B",
    company: "AquaTech Pvt.",
    project_state: "Uttar Pradesh",
    intervention: "Agriculture",
    requested_amount: 120000,
    manager: "Priya Singh",
    purpose: "Installation of water pipelines in Zone B villages.",
    status: "approved",
  },
  {
    id: 3,
    project_name: "Solar Panel Setup",
    company: "GreenEnergy Co.",
    project_state: "Gujarat",
    intervention: "Energy",
    requested_amount: 85000,
    manager: "Rahul Mehta",
    purpose: "Advance for solar panel procurement and installation.",
    status: "rejected",
  },
  {
    id: 4,
    project_name: "School Renovation",
    company: "EduBuild Inc.",
    project_state: "Madhya Pradesh",
    intervention: "Education",
    requested_amount: 35000,
    manager: "Sneha Verma",
    purpose: "Renovation of classrooms and sanitation facilities.",
    status: "pending",
  },
  {
    id: 5,
    project_name: "Health Camp – Rural",
    company: "MedAid NGO",
    project_state: "Bihar",
    intervention: "Healthcare",
    requested_amount: 20000,
    manager: "Deepak Jha",
    purpose: "Medical supplies and logistics for rural health camp.",
    status: "approved",
  },
];

const AdvancePayList = () => {
  const [data, setData] = useState(STATIC_DATA);
  const navigate = useNavigate();

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: ["project_name", "company", "project_state", "intervention", "manager", "purpose"],
    itemsPerPage: 100,
  });

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this advance request?")) return;
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:  { cls: "badge badge-warning", label: "Pending"  },
      approved: { cls: "badge badge-success", label: "Approved" },
      rejected: { cls: "badge badge-danger",  label: "Rejected" },
    };
    const s = (status || "pending").toLowerCase();
    const { cls, label } = map[s] || map["pending"];
    return <span className={cls}>{label}</span>;
  };

  return (
    <>
      <PageTitle activeMenu="Advance Payment List" motherMenu="Advance Payment" />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Advance Payment List</Card.Title>

            <div className="d-flex align-items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search advance payments..."
              />

              <TableExportActions
                data={data}
                columns={[
                  { label: "Project Name",  key: "project_name"     },
                  { label: "Company",       key: "company"          },
                  { label: "State",         key: "project_state"    },
                  { label: "Intervention",  key: "intervention"     },
                  { label: "Amount (₹)",    key: "requested_amount" },
                  { label: "Manager",       key: "manager"          },
                  { label: "Purpose",       key: "purpose"          },
                  { label: "Status",        key: "status"           },
                ]}
                fileName="Advance_Payment_List"
              />

               </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Project Name</th>
                  <th>Company</th>
                  <th>State</th>
                  <th>Intervention</th>
                  <th>Amount (₹)</th>
                  <th>Manager</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{indexOfFirst + index + 1}</td>
                      <td>{item.project_name || "N/A"}</td>
                      <td>{item.company || "N/A"}</td>
                      <td>{item.project_state || "N/A"}</td>
                      <td>{item.intervention || "N/A"}</td>
                      <td>
                        {item.requested_amount
                          ? `₹${Number(item.requested_amount).toLocaleString("en-IN")}`
                          : "N/A"}
                      </td>
                      <td>{item.manager || "N/A"}</td>
                      <td>
                        <span
                          title={item.purpose}
                          style={{
                            maxWidth: "150px",
                            display: "inline-block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.purpose || "N/A"}
                        </span>
                      </td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <div className="d-flex">
                          <button
                            className="btn btn-primary shadow btn-xs sharp me-1"
                            onClick={() => navigate(`/update-advance-payment/${item.id}`)}
                          >
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                          <button
                            className="btn btn-danger shadow btn-xs sharp"
                            onClick={() => handleDelete(item.id)}
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center">
                      No Data Found
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

export default AdvancePayList;