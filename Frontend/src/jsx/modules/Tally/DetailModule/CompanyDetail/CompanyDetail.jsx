import React, { useState } from "react";
import { Col, Card, Table, Button } from "react-bootstrap";
import PageTitle from "../../../../layouts/PageTitle";
import TableExportActions from "../../../../components/Common/TableExportActions";
import Pagination from "../../../../components/Common/Pagination";
import {
  useSearchFilter,
  SearchInput,
} from "../../../../components/Common/useSearchFilter";

const CompanyDetail = () => {
  const [data] = useState([
    {
      id: 1,
      name: "ABC Pvt Ltd",
      short_name: "ABC",
      code: "CMP001",
      gst: "07ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      tan: "DEL12345A",
      city: "Delhi",
      state: "Delhi",
      zipcode: 110001,
      status: 1,
    },
    {
      id: 2,
      name: "XYZ Industries",
      short_name: "XYZ",
      code: "CMP002",
      gst: "09XYZDE1234F1Z2",
      pan: "XYZDE1234F",
      tan: "UP123456B",
      city: "Noida",
      state: "Uttar Pradesh",
      zipcode: 201301,
      status: 0,
    },
  ]);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: [
      "name",
      "short_name",
      "gst",
      "pan",
      "city",
      "state",
      "code",
    ],
    itemsPerPage: 100,
  });

  return (
    <>
      <PageTitle
        activeMenu="Company Details"
        motherMenu="Tally Integration"
      />

      <Col lg={12}>
        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <Card.Title>Company Details</Card.Title>

            <div className="d-flex align-items-center gap-2">

              <Button
                variant="primary"
                onClick={() => {
                  // Popup Open Here
                }}
              >
                <i className="fa fa-plus me-2"></i>
                Add Company Details
              </Button>

              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search Company..."
              />

              <TableExportActions
                data={data}
                columns={[
                  { label: "Company Name", key: "name" },
                  { label: "Short Name", key: "short_name" },
                  { label: "Company Code", key: "code" },
                  { label: "GST", key: "gst" },
                  { label: "PAN", key: "pan" },
                  { label: "TAN", key: "tan" },
                  { label: "City", key: "city" },
                  { label: "State", key: "state" },
                  { label: "Zip Code", key: "zipcode" },
                  { label: "Status", key: "status" },
                ]}
                fileName="Company_Details"
              />
            </div>
          </Card.Header>

          <Card.Body>
            <Table responsive className="text-nowrap">
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Company Name</th>
                  <th>Short Name</th>
                  <th>Code</th>
                  <th>GST No.</th>
                  <th>PAN No.</th>
                  <th>TAN No.</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Zip Code</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((company, index) => (
                    <tr key={company.id}>
                      <td>{indexOfFirst + index + 1}</td>

                      <td>{company.name}</td>
                      <td>{company.short_name}</td>
                      <td>{company.code}</td>
                      <td>{company.gst || "N/A"}</td>
                      <td>{company.pan || "N/A"}</td>
                      <td>{company.tan || "N/A"}</td>
                      <td>{company.city}</td>
                      <td>{company.state}</td>
                      <td>{company.zipcode}</td>

                      <td>
                        <div className="d-flex align-items-center">
                          <i
                            className={`fa fa-circle me-1 ${
                              company.status
                                ? "text-success"
                                : "text-danger"
                            }`}
                          ></i>

                          {company.status ? "Active" : "Inactive"}
                        </div>
                      </td>

                      <td>
                        <div className="d-flex">
                          <button className="btn btn-primary shadow btn-xs sharp me-1">
                            <i className="fas fa-pencil-alt"></i>
                          </button>

                          <button className="btn btn-danger shadow btn-xs sharp">
                            <i className="fa fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center">
                      No Company Found
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

export default CompanyDetail;