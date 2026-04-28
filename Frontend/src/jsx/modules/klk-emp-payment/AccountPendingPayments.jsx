import React from "react";
import PaymentListBase from "./AccountsList";

const AccountPendingPayments = () => {
  return (
    <PaymentListBase
      status={0}
      pageTitle="Pending Payments"
      cardTitle="Pending Payments"
    />
  );
};

export default AccountPendingPayments;