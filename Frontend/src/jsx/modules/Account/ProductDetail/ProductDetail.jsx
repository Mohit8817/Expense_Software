import React, { useState, useEffect, useCallback, useRef } from "react";
import { Col, Row, Card, Table, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import PageTitle from "../../../layouts/PageTitle";
import TableExportActions from "../../../components/Common/TableExportActions";
import Pagination from "../../../components/Common/Pagination";
import { useSearchFilter, SearchInput } from "../../../components/Common/useSearchFilter";
import ProductDetailForm from "./ProductDetailForm";
import ProductExcelImport from "./ProductExcelImport";
import DocumentAttachments from "../vouchers/shared/DocumentAttachments";
import { ATTACHMENT_DOCUMENT_TYPES } from "../documentAttachmentApi";
import { getAllProducts, getProductById, deleteProduct } from "../productApi";

const ProductDetail = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list");
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const attachmentRef = useRef(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const products = await getAllProducts();
      setData(products);
    } catch (error) {
      toast.error(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const {
    search,
    setSearch,
    currentPage,
    setCurrentPage,
    totalItems,
    paginatedData,
    indexOfFirst,
  } = useSearchFilter(data, {
    keys: ["name", "desc", "hsn_sac", "units"],
    itemsPerPage: 100,
  });

  const activeCount = data.filter((p) => p.status === 1).length;
  const inactiveCount = data.length - activeCount;

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };

  const openAddForm = () => {
    setEditId(null);
    setFormData(null);
    setView("form");
  };

  const openEditForm = async (id) => {
    try {
      setLoading(true);
      const product = await getProductById(id);
      setEditId(id);
      setFormData({
        name: product.name,
        desc: product.desc,
        hsn_sac: product.hsn_sac || "",
        units: product.units || "",
        status: String(product.status ?? 1),
      });
      setView("form");
    } catch (error) {
      toast.error(error.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    setView("list");
    setEditId(null);
    setFormData(null);
  };

  const handleSaved = async (savedId) => {
    const id = savedId || editId;
    if (id && attachmentRef.current?.hasPending?.()) {
      try {
        await attachmentRef.current.uploadPending(id);
      } catch (error) {
        toast.error(error.message || "Record saved but attachment upload failed");
      }
    }
    toast.success(editId ? "Product updated successfully" : "Product created successfully");
    closeForm();
    fetchProducts();
  };

  return (
    <>
      <PageTitle activeMenu="Product Master" motherMenu="Account" />

      {view === "list" && (
        <>
          <Row>
            <Col xl={4} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Total Products</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0">{data.length}</h2>
                  <span><small className="text-muted">All Products</small></span>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={4} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Active</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0 text-success">{activeCount}</h2>
                  <span><small className="text-muted">Active products</small></span>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={4} lg={6} md={6} sm={6}>
              <Card>
                <Card.Header className="border-0 pb-0">
                  <h6 className="mb-0">Inactive</h6>
                </Card.Header>
                <Card.Body className="pt-2">
                  <h2 className="card-title mb-0 text-secondary">{inactiveCount}</h2>
                  <span><small className="text-muted">Inactive products</small></span>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm rounded">
                <Card.Body>
                  <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-3 bg-white">
                    <Card.Title className="mb-0 flex-shrink-0 fw-bold">Product List</Card.Title>

                    <div className="d-flex align-items-center gap-2 flex-wrap flex-lg-nowrap ms-auto">
                      <div style={{ minWidth: 150 }}>
                        <SearchInput
                          value={search}
                          onChange={setSearch}
                          placeholder="Search products..."
                        />
                      </div>

                      <TableExportActions
                        data={data}
                        columns={[
                          { label: "Name", key: "name" },
                          { label: "Description", key: "desc" },
                          { label: "HSN/SAC", key: "hsn_sac" },
                          { label: "Units", key: "units" },
                          { label: "Status", key: "status" },
                        ]}
                        fileName="Product_List"
                      />

                      <button
                        type="button"
                        className="btn btn-outline-success text-nowrap flex-shrink-0 d-flex align-items-center gap-2"
                        onClick={() => setShowImport(true)}
                      >
                        <i className="fa fa-file-excel"></i> Import Excel
                      </button>

                      <button
                        className="btn btn-primary text-nowrap flex-shrink-0 d-flex align-items-center gap-2"
                        onClick={openAddForm}
                      >
                        <i className="fa fa-plus"></i> New Product
                      </button>
                    </div>
                  </Card.Header>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="pt-0">
                  {loading ? (
                    <p className="text-center text-muted py-5">Loading...</p>
                  ) : (
                    <Table responsive className="text-nowrap align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Sno</th>
                          <th>Product Name</th>
                          <th>Description</th>
                          <th>HSN/SAC</th>
                          <th>Units</th>
                          <th>Status</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.length > 0 ? (
                          paginatedData.map((item, index) => (
                            <tr key={item.id}>
                              <td className="text-muted">{indexOfFirst + index + 1}</td>
                              <td className="fw-semibold">{item.name}</td>
                              <td>{item.desc}</td>
                              <td>{item.hsn_sac || "—"}</td>
                              <td>{item.units || "—"}</td>
                              <td>
                                <Badge bg={item.status === 1 ? "success" : "secondary"} className="rounded-pill">
                                  {item.status === 1 ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="text-end">
                                <button
                                  className="btn btn-primary shadow btn-xs sharp me-1"
                                  onClick={() => openEditForm(item.id)}
                                  title="Edit"
                                >
                                  <i className="fas fa-pencil-alt"></i>
                                </button>
                                <button
                                  className="btn btn-danger shadow btn-xs sharp"
                                  onClick={() => handleDelete(item.id)}
                                  title="Delete"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" className="text-center text-muted py-5">
                              No products found
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
          </Row>
        </>
      )}

      <ProductExcelImport
        show={showImport}
        onHide={() => setShowImport(false)}
        onImported={fetchProducts}
      />

      {view === "form" && (
        <Row>
          <Col lg={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="d-flex align-items-center gap-2 bg-white">
                <button className="btn btn-light" onClick={closeForm} title="Back to list">
                  <i className="fa fa-arrow-left"></i>
                </button>
                <Card.Title className="mb-0 fw-bold">
                  {editId ? "Edit Product" : "New Product"}
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <ProductDetailForm
                  productId={editId}
                  initialData={formData}
                  onClose={closeForm}
                  onSaved={handleSaved}
                />
                <DocumentAttachments
                  ref={attachmentRef}
                  documentType={ATTACHMENT_DOCUMENT_TYPES.PRODUCT}
                  documentId={editId}
                  inline
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
};

export default ProductDetail;
