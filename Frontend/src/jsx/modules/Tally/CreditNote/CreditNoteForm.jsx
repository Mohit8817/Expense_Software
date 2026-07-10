import React from "react";
import { Card, Col, Table } from "react-bootstrap";
import PageTitle from "../../../layouts/PageTitle";

const CreditNoteForm = () => {
  return (
    <>


      <Col lg={12}>
        <Card>
                 <Card.Body>
            <form>
              <div className="row">

                {/* Credit Note No */}
                <div className="col-md-4 mb-3">
                  <label>Credit Note No</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Credit Note No"
                  />
                </div>

                {/* Credit Note Date */}
                <div className="col-md-4 mb-3">
                  <label>Credit Note Date</label>
                  <input
                    type="date"
                    className="form-control"
                  />
                </div>

                {/* Invoice No */}
                <div className="col-md-4 mb-3">
                  <label>Invoice No</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Invoice No"
                  />
                </div>

                {/* Customer Name */}
                <div className="col-md-4 mb-3">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Customer Name"
                  />
                </div>

                {/* GSTIN */}
                <div className="col-md-4 mb-3">
                  <label>Customer GSTIN</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter GSTIN"
                  />
                </div>

                {/* Bill Amount */}
                <div className="col-md-4 mb-3">
                  <label>Bill Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter Bill Amount"
                  />
                </div>

              </div>

              {/* Bill Items */}
              <h5 className="mt-4 mb-3">Bill Items</h5>

              <Table bordered responsive>
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th>Item Name</th>
                    <th width="15%">Quantity</th>
                    <th width="20%">Rate</th>
                    <th width="20%">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>1</td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Item Name"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Qty"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Rate"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Amount"
                      />
                    </td>
                  </tr>
                </tbody>
              </Table>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
              >
                + Add Item
              </button>

              {/* GST Details */}
              <h5 className="mb-3">GST Details</h5>

              <Table bordered responsive>
                <thead>
                  <tr>
                    <th width="60%">Ledger Name</th>
                    <th>Amount</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>
                      <select className="form-control">
                        <option>Select Ledger</option>
                        <option>CGST</option>
                        <option>SGST</option>
                        <option>IGST</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Amount"
                      />
                    </td>
                  </tr>
                </tbody>
              </Table>

              <button
                type="button"
                className="btn btn-outline-primary btn-sm mb-4"
              >
                + Add GST
              </button>

              {/* Buttons */}
              <div className="text-end">
                <button
                  type="reset"
                  className="btn btn-secondary me-2"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Credit Note
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      </Col>
    </>
  );
};

export default CreditNoteForm;