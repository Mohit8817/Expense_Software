import React from "react";
import PaymentListBase from "./AccountsList";

const AccountPaidPayments = () => {
  return (
    <PaymentListBase
      status={2}
      pageTitle="Paid Payments"
      cardTitle="Paid Payments"
    />
  );
};

export default AccountPaidPayments;