import React from "react";
import ManagerExpenseTable from "./ManagerList";

/**
 * Shows APPROVED / REJECTED expenses (approval_status != 0).
 * Route: /manager/approved-payments  (or wherever you register it)
 */
const ManagerApprovedPayments = () => {
  return (
    <ManagerExpenseTable
      status={1}
      pageTitle="Approved Payments"
      cardTitle="Approved / Rejected Payments"
    />
  );
};

export default ManagerApprovedPayments;