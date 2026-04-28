import React from "react";
import ManagerExpenseTable from "./ManagerList";

/**
 * Shows only PENDING expenses (approval_status = 0).
 * Route: /manager/pending-payments  (or wherever you register it)
 */
const ManagerPendingPayments = () => {
  return (
    <ManagerExpenseTable
      status={0}
      pageTitle="Pending Approvals"
      cardTitle="Pending Manager Approvals"
    />
  );
};

export default ManagerPendingPayments;