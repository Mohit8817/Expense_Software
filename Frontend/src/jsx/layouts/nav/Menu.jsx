const section = (title) => ({ type: "section", title });

export const MenuList = [
  section("Dashboards"),

  {
    title: "Admin Dashboard",
    to: "/admin-dashboard",
    permission: "admin_dashboard",
    iconStyle: <i className="flaticon-home" />,
  },
  {
    title: "Manager Dashboard",
    to: "/manager-dashboard",
    permission: "manager_dashboard",
    iconStyle: <i className="flaticon-pie-chart" />,
  },
  {
    title: "User Dashboard",
    to: "/user-dashboard",
    permission: "user_dashboard",
    iconStyle: <i className="flaticon-user-1" />,
  },

  section("HR & Operations"),

  {
    title: "Employee",
    iconStyle: <i className="flaticon-user" />,
    classsChange: "mm-collapse",
    permission: "view_user",
    content: [
      { title: "Add Employee", to: "/add-employee", permission: "create_user" },
      { title: "Employee List", to: "/employee-List", permission: "view_user" },
    ],
  },
  {
    title: "Project Master",
    iconStyle: <i className="flaticon-file" />,
    classsChange: "mm-collapse",
    permission: "view_project",
    content: [
      { title: "Add Project", to: "/project-master", permission: "create_project" },
      { title: "Project List", to: "/project-list", permission: "view_project" },
    ],
  },
  {
    title: "Intervention",
    iconStyle: <i className="flaticon-registration" />,
    classsChange: "mm-collapse",
    permission: "view_intervention",
    content: [
      { title: "Add Intervention", to: "/intervention-Form", permission: "create_intervention" },
      { title: "Intervention List", to: "/intervention-List", permission: "view_intervention" },
    ],
  },

  section("Expense & Payments"),

  {
    title: "Employee Expenses",
    iconStyle: <i className="flaticon-price-tag" />,
    classsChange: "mm-collapse",
    permission: "view_expense",
    content: [
      { title: "Add Expense", to: "/Add-Expense", permission: "create_expense" },
      { title: "Payment List", to: "/payment-list", permission: "view_expense" },
      { title: "Reviewer List", to: "/Reviewer-List", permission: "reviewer_expense" },
    ],
  },
  {
    title: "Manager Approvals",
    iconStyle: <i className="flaticon-approved" />,
    classsChange: "mm-collapse",
    permission: "view_expense",
    content: [
      { title: "Pending Payments", to: "/manager/pending-payments", permission: "manager_expense" },
      { title: "Approved Payments", to: "/manager/approved-payments", permission: "manager_expense" },
    ],
  },
  {
    title: "Accounts Payable",
    iconStyle: <i className="flaticon-business-and-trade" />,
    classsChange: "mm-collapse",
    permission: "account_expense",
    content: [
      { title: "Pending Payments", to: "/account/pending-payments", permission: "account_expense" },
      { title: "Paid Payments", to: "/account/paid-payments", permission: "account_expense" },
    ],
  },
  {
    title: "Advance Payment",
    iconStyle: <i className="flaticon-project" />,
    classsChange: "mm-collapse",
    permission: "advance_payment",
    content: [
      { title: "Advance Dashboard", to: "/AdvancePaymentDashboard", permission: "advance_payment" },
    ],
  },

  section("Accounting"),

  {
    title: "Account Dashboard",
    to: "/account/dashboard",
    permission: "view_account_dashboard",
    iconStyle: <i className="flaticon-bar-chart" />,
  },

  {
    title: "Invoices",
    iconStyle: <i className="flaticon-shopping-bag" />,
    classsChange: "mm-collapse",
    content: [
      { title: "Sales Invoice", to: "/account/Sales-Invoice", permission: "view_sales_invoice" },
      { title: "Purchase Invoice", to: "/account/Purchase-Invoice", permission: "view_purchase_invoice" },
    ],
  },
  {
    title: "Accounting Masters",
    iconStyle: <i className="flaticon-cms" />,
    classsChange: "mm-collapse",
    content: [
      { title: "Product Master", to: "/account/Product-Detail", permission: "view_product_master" },
      { title: "Company Master", to: "/account/Company-Detail", permission: "view_company_master" },
    ],
  },
  {
    title: "Vouchers & Documents",
    iconStyle: <i className="flaticon-document" />,
    classsChange: "mm-collapse",
    content: [
      { title: "Payment", to: "/account/Payment", permission: "view_payment_voucher" },
      { title: "Journal Voucher", to: "/account/Expense", permission: "view_journal_voucher" },
      { title: "Credit Note", to: "/account/credit-note", permission: "view_credit_note" },
      { title: "Debit Note", to: "/account/debit-note", permission: "view_debit_note" },
      { title: "Delivery Challan", to: "/account/Delivery-Challan", permission: "view_delivery_challan" },
      { title: "Account Reports", to: "/account/reports", permission: "view_account_reports" },
    ],
  },

  section("Reports & Analytics"),

  {
    title: "Reports",
    iconStyle: <i className="flaticon-bar-chart" />,
    classsChange: "mm-collapse",
    permission: "view_reports",
    content: [
      { title: "Intervention Reports", to: "/Intervention-Reports", permission: "intervention_report" },
      { title: "Paid Expenses", to: "/Paid-Expense", permission: "paid_expense_report" },
      { title: "User Expense Reports", to: "/User-Expense-Reports", permission: "user_expense_report" },
    ],
  },

  section("Administration"),

  {
    title: "Settings",
    iconStyle: <i className="flaticon-editing" />,
    classsChange: "mm-collapse",
    permission: "view_settings",
    content: [
      { title: "Role Permission", to: "/role/list", permission: "view_role" },
      { title: "Add Role", to: "/role/add-role", permission: "create_role" },
      { title: "Add Permission", to: "/permission/add-permission", permission: "create_permission" },
      { title: "Permission List", to: "/permission/list", permission: "view_permission" },
    ],
  },
];
