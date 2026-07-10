export const MenuList = [
  { title: 'Admin Dashboard', to: '/admin-dashboard', permission: "admin_dashboard", iconStyle: <i className="flaticon-home" /> },

  { title: 'Manager Dashboard ', to: '/manager-dashboard', permission: "manager_dashboard", iconStyle: <i className="flaticon-home" /> },

  { title: 'Masters', classsChange: 'menu-title' },

  { title: 'User Dashboard ', to: '/user-dashboard', permission: "user_dashboard", iconStyle: <i className="flaticon-home" /> },

  {
    title: 'Employee',
    iconStyle: <i className="flaticon flaticon-user" />,
    classsChange: 'mm-collapse',
    permission: "view_user",
    content: [
      { title: 'Add Employee', to: 'add-employee', permission: "create_user" },
      { title: 'Employee List', to: 'employee-List', permission: "view_user" },
    ]
  },

  {
    title: 'Project Master',
    iconStyle: <i className="flaticon flaticon-file" />,
    classsChange: 'mm-collapse',
    permission: "view_project",
    content: [
      { title: 'Add Project', to: 'project-master', permission: "create_project" },
      { title: 'Project List', to: 'project-list', permission: "view_project" },
    ]
  },

  {
    title: 'Intervention',
    iconStyle: <i className="flaticon-registration" />,
    classsChange: 'mm-collapse',
    permission: "view_intervention",
    content: [
      { title: 'Add Intervention', to: 'intervention-form', permission: "create_intervention" },
      { title: 'Intervention List', to: 'intervention-List', permission: "view_intervention" },
    ]
  },

  {
    title: 'Employee Payment',
    iconStyle: <i className="flaticon-grid" />,
    classsChange: 'mm-collapse',
    permission: "view_expense",
    content: [
      { title: 'Add Expense', to: '/Add-Expense', permission: "create_expense" },
      { title: 'Payment List', to: '/payment-list', permission: "view_expense" },
      // { title: 'Manager List', to: '/manager-list', permission: "manager_expense" },
      { title: 'Reviewer List', to: '/reviewer-list', permission: "reviewer_expense" },
      // { title: 'Accounts List', to: '/account-list', permission: "account_expense" },
    ]
  },


  {
    title: 'Manager Payment',
    iconStyle: <i className="flaticon-grid" />,
    classsChange: 'mm-collapse',
    permission: "view_expense",
    content: [

      { title: 'Pending Payments', to: '/manager/pending-payments', permission: "manager_expense" },
      { title: 'All Payments', to: '/manager/approved-payments', permission: "manager_expense" },


    ]
  },



  {
    title: 'Accounts',
    iconStyle: <i className="flaticon-grid" />,
    classsChange: 'mm-collapse',
    permission: "account_expense",
    content: [
      { title: 'Pending Payments', to: '/account/pending-payments', permission: "account_expense" },
      { title: 'Paid Payments', to: '/account/paid-payments', permission: "account_expense" },
    ]
  },

  {
    title: 'Reports',
    classsChange: 'mm-collapse',
    iconStyle: <i className=" flaticon-project" />,
    permission: "view_reports",
    content: [
      { title: 'Intervention Reports', to: '/Intervention-Reports' },
      { title: 'Paid Expenses', to: '/Paid-Expense'},
      { title: 'User Expense Reports', to: '/User-Expense-Reports' },
      // { title: 'User Detail Reports', to: '/User-Detail-Reports' }
    ],
  },

  {
    title: 'Advance Payment',
    classsChange: 'mm-collapse',
    iconStyle: <i className=" flaticon-project" />,
    permission: "",
    content: [
      // { title: 'Advance Payment Dashboard', to: '/AdvancePayDashboard' },
      { title: 'Advance Payment Dashboard', to: '/AdvancePaymentDashboard' },
      { title: 'Add Advance Payment', to: '/AdvancePayForm' },
      { title: 'Advance Payment List', to: '/AdvancePayList' },
    ],
  },



  //   {
  //   title: 'Advance Payment',
  //   classsChange: 'mm-collapse',
  //   iconStyle: <i className=" flaticon-project" />,
  //   permission: "",
  //   content: [
  //     { title: 'Advance Payment Dashboard', to: '/AdvancePaymentDashboard' },
  
  //   ],
  // },












  {
  title: 'Tally',
  iconStyle: <i className="flaticon flaticon-shopping-bag" />,
  classsChange: 'mm-collapse',
  permission: "",
  content: [

    {
      title: 'Sales Invoice',
      to: '/tally/Sales-Invoice',
      // permission: "view_sales_invoice"
    },

    {
      title: 'Purchase Invoice',
      to: '/tally/Purchase-Invoice',
      // permission: "view_purchase_invoice"
    },

    {
      title: 'Payment',
      to: '/tally/Payment',
      // permission: "view_payment"
    },

    {
      title: 'Expense',
      to: '/tally/Expense',
      // permission: "view_expense"
    },

    {
      title: 'Credit Note',
      to: '/tally/credit-note',
      // permission: "view_credit_note"
    },

    {
      title: 'Debit Note',
      to: '/tally/debit-note',
      // permission: "view_debit_note"
    },

    {
      title: 'Delivery Challan',
      to: '/tally/Delivery-Challan',
      // permission: "view_delivery_challan"
    },

    {
      title: 'Material Transfer',
      to: '/tally/Material-Transfer',
      // permission: "view_material_transfer"
    }

  ]
},


  {
    title: 'Settings',
    classsChange: 'mm-collapse',
    iconStyle: <i className="flaticon-registration" />,
    permission: "view_settings",
    content: [
      { title: 'Role Permission', to: '/role/list', permission: "view_role" },
      { title: 'Add Role', to: '/role/add-role', permission: "create_role" },
      { title: 'Add Permission', to: '/permission/add-permission', permission: "create_permission" },
      { title: 'Permission List', to: '/permission/list', permission: "view_permission" },
    ],
  },

];