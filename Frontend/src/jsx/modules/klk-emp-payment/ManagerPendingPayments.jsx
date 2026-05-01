import React from "react";
import ManagerExpenseTable from "./ManagerList";


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