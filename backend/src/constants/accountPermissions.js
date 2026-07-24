/**
 * Account module permissions — same pattern as Project / Expense:
 * view_*, create_*, edit_*, delete_*
 *
 * Run once per company:
 *   node scripts/seedAccountPermissions.js klk1234 1
 * (company_id and created_by user id)
 */
export const ACCOUNT_PERMISSIONS = [
  { name: "view_account_dashboard", label: "View Account Dashboard", module: "Accounts" },
  { name: "view_account_reports", label: "View Account Reports", module: "Accounts" },

  { name: "view_sales_invoice", label: "View Sales Invoice", module: "Sales Invoice" },
  { name: "create_sales_invoice", label: "Create Sales Invoice", module: "Sales Invoice" },
  { name: "edit_sales_invoice", label: "Edit Sales Invoice", module: "Sales Invoice" },
  { name: "delete_sales_invoice", label: "Delete Sales Invoice", module: "Sales Invoice" },

  { name: "view_purchase_invoice", label: "View Purchase Invoice", module: "Purchase Invoice" },
  { name: "create_purchase_invoice", label: "Create Purchase Invoice", module: "Purchase Invoice" },
  { name: "edit_purchase_invoice", label: "Edit Purchase Invoice", module: "Purchase Invoice" },
  { name: "delete_purchase_invoice", label: "Delete Purchase Invoice", module: "Purchase Invoice" },

  { name: "view_credit_note", label: "View Credit Note", module: "Credit Note" },
  { name: "create_credit_note", label: "Create Credit Note", module: "Credit Note" },
  { name: "edit_credit_note", label: "Edit Credit Note", module: "Credit Note" },
  { name: "delete_credit_note", label: "Delete Credit Note", module: "Credit Note" },

  { name: "view_debit_note", label: "View Debit Note", module: "Debit Note" },
  { name: "create_debit_note", label: "Create Debit Note", module: "Debit Note" },
  { name: "edit_debit_note", label: "Edit Debit Note", module: "Debit Note" },
  { name: "delete_debit_note", label: "Delete Debit Note", module: "Debit Note" },

  { name: "view_delivery_challan", label: "View Delivery Challan", module: "Delivery Challan" },
  { name: "create_delivery_challan", label: "Create Delivery Challan", module: "Delivery Challan" },
  { name: "edit_delivery_challan", label: "Edit Delivery Challan", module: "Delivery Challan" },
  { name: "delete_delivery_challan", label: "Delete Delivery Challan", module: "Delivery Challan" },

  { name: "view_journal_voucher", label: "View Journal Voucher", module: "Journal Voucher" },
  { name: "create_journal_voucher", label: "Create Journal Voucher", module: "Journal Voucher" },
  { name: "edit_journal_voucher", label: "Edit Journal Voucher", module: "Journal Voucher" },
  { name: "delete_journal_voucher", label: "Delete Journal Voucher", module: "Journal Voucher" },

  { name: "view_payment_voucher", label: "View Payment Voucher", module: "Payment Voucher" },
  { name: "create_payment_voucher", label: "Create Payment Voucher", module: "Payment Voucher" },
  { name: "edit_payment_voucher", label: "Edit Payment Voucher", module: "Payment Voucher" },
  { name: "delete_payment_voucher", label: "Delete Payment Voucher", module: "Payment Voucher" },

  { name: "view_company_master", label: "View Company Master", module: "Company Master" },
  { name: "create_company_master", label: "Create Company Master", module: "Company Master" },
  { name: "edit_company_master", label: "Edit Company Master", module: "Company Master" },
  { name: "delete_company_master", label: "Delete Company Master", module: "Company Master" },

  { name: "view_product_master", label: "View Product Master", module: "Product Master" },
  { name: "create_product_master", label: "Create Product Master", module: "Product Master" },
  { name: "edit_product_master", label: "Edit Product Master", module: "Product Master" },
  { name: "delete_product_master", label: "Delete Product Master", module: "Product Master" },
];

/** Map attachment document_type → permission keys */
export const ATTACHMENT_PERMISSIONS = {
  PURCHASE: { view: "view_purchase_invoice", edit: "edit_purchase_invoice" },
  SALES: { view: "view_sales_invoice", edit: "edit_sales_invoice" },
  CREDIT_NOTE: { view: "view_credit_note", edit: "edit_credit_note" },
  DEBIT_NOTE: { view: "view_debit_note", edit: "edit_debit_note" },
  DELIVERY_CHALLAN: { view: "view_delivery_challan", edit: "edit_delivery_challan" },
  JOURNAL_VOUCHER: { view: "view_journal_voucher", edit: "edit_journal_voucher" },
  PAYMENT_VOUCHER: { view: "view_payment_voucher", edit: "edit_payment_voucher" },
  COMPANY: { view: "view_company_master", edit: "edit_company_master" },
  PRODUCT: { view: "view_product_master", edit: "edit_product_master" },
};
