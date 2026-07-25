import { useEffect, useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";
import { getOutletKey } from "../../utils/navUtils";
import { isTokenExpired } from "../../utils/auth";
import Nav from "../layouts/nav";
import Footer from "../layouts/Footer";
// dashboard 
import Home from "../pages/dashboard/Home";
import DashboardDark from "../pages/dashboard/DashboardDark";
import AdminDashboard from "../pages/dashboard/Admin/AdminDashboard";
import UserCommanSection from "../pages/dashboard/User/UserCommanSection";
import CommanSection from "../pages/dashboard/Manager/CommanSection";

// forms 
import Element from "../pages/forms/Element/Element";
import Wizard from "../pages/forms/Wizard/Wizard";
import CkEditor from "../pages/forms/CkEditor/CkEditor";
import Pickers from "../pages/forms/Pickers/Pickers";
import FormValidation from "../pages/forms/FormValidation/FormValidation";
// table 
import BootstrapTable from "../pages/table/BootstrapTable";
import DataTable from "../pages/table/DataTable";
// pages 
import Error400 from "../pages/error/Error400";
import EmptyPage from "../pages/error/emptypage";

import Login from "../pages/authentication/Login";
import Registration from "../pages/authentication/Registration";
import ScrollToTop from "../element/scrolltotop";

import AddEmployee from "../modules/Employee/AddEmployee";
import EmployeeList from "../modules/Employee/EmployeeList";
import ProjectMasterForm from "../modules/project-master/ProjectForm";
import ProjectMasterList from "../modules/project-master/ProjectList";
import InterventionForm from "../modules/intervention/InterventionForm";
import InterventionList from "../modules/intervention/InterventionList";
import PaymentList from "../modules/klk-emp-payment/PaymentList";
import ReviewerList from "../modules/klk-emp-payment/ReviewerList";
import AccountsList from "../modules/klk-emp-payment/AccountsList";
import ManagerList from "../modules/klk-emp-payment/ManagerList";
import AddExpense from "../modules/klk-emp-payment/AddExpense";
import UpdateEmployee from "../modules/Employee/UpdateEmployee";
import ProjectFormUpdate from "../modules/project-master/ProjectFromUpdate";
import RoleList from "../modules/RolePermission/RoleList";
import AddRole from "../modules/RolePermission/AddRole"
import RoleEdit from "../modules/RolePermission/RoleEdit"
import PermissionList from "../modules/RolePermission/PermissionList";
import PermissionForm from "../modules/RolePermission/PermissionForm"
import AssignPermission from "../modules/RolePermission/AssignPermission"
import ManagerPendingPayments from "../modules/klk-emp-payment/ManagerPendingPayments";
import ManagerApprovedPayments from "../modules/klk-emp-payment/ManagerApprovedPayments";
import AccountPaidPayments from "../modules/klk-emp-payment/Accountpaidpayments";
import AccountPendingPayments from "../modules/klk-emp-payment/AccountPendingPayments";
import InterventionReports from "../modules/Report/InterventionReports";
import PaidExpense from "../modules/Report/PaidExpense";

import AdvancePayList from "../modules/Advancepayment/AdvancePayList";
import AdvancePayForm from "../modules/Advancepayment/AdvancePayForm";
import AdvancePaymentDashboard from "../modules/Advancepayment/AdvancePaymentDashboard";
import UserDetailReport from "../modules/Report/UserDetailReport";
import UserExpenseReports from "../modules/Report/UserExpenseReports";

import CreditNote from "../modules/Account/CreditNote/CreditNote";
import DebitNote from "../modules/Account/DebitNote/DebitNote";
import DeliveryChallan from "../modules/Account/DeliveryChallan/DeliveryChallan";
import Expense from "../modules/Account/Expense/Expense";
import MaterialTransfer from "../modules/Account/MaterialTransfer/MaterialTransfer";
import Payment from "../modules/Account/Payment/Payment";
import PurchaseInvoice from "../modules/Account/PurchaseInvoice/PurchaseInvoice";
import SalesInvoice from "../modules/Account/SalesInvoice/SalesInvoice";
import ProductDetail from "../modules/Account/ProductDetail/ProductDetail";
import CompanyDetail from "../modules/Account/CompanyDetail/CompanyDetail";
import AccountDashboard from "../modules/Account/AccountDashboard";
import AccountReports from "../modules/Account/AccountReports";







const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

        if (!token || !user) {
            return <Navigate to="/login" replace />;
        }
        
        if (isTokenExpired(token)) {
            localStorage.clear();
            return <Navigate to="/login" replace />;
        }

    return children;
};


const PublicRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user && !isTokenExpired(token)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};


const Markup = () => {
    const protectedMenu = [
        { path: 'dashboard', element: <Home /> },
        { path: 'dashboard-dark', element: <DashboardDark /> },

        { path: '/admin-dashboard', element: <AdminDashboard /> },
        { path: '/user-dashboard', element: <UserCommanSection /> },
        { path: '/manager-dashboard', element: <CommanSection /> },

        { path: '/add-employee', element: <AddEmployee /> },
        { path: '/employee-List', element: <EmployeeList /> },
        { path: '/update-employee/:id', element: <UpdateEmployee /> },

        { path: '/project-master', element: <ProjectMasterForm /> },
        { path: '/project-list', element: <ProjectMasterList /> },
        { path: '/project-edit/:id', element: <ProjectFormUpdate /> },

        { path: '/intervention-Form', element: <InterventionForm /> },
        { path: '/intervention-List', element: <InterventionList /> },

        { path: '/Add-Expense', element: <AddExpense /> },
        { path: '/payment-list', element: <PaymentList /> },
        { path: '/Reviewer-List', element: <ReviewerList /> },
        { path: '/Manager-List', element: <ManagerList /> },
        { path: '/Account-List', element: <AccountsList /> },

        { path: 'form-element', element: <Element /> },
        { path: 'form-wizard', element: <Wizard /> },
        { path: 'form-ckeditor', element: <CkEditor /> },
        { path: 'form-pickers', element: <Pickers /> },
        { path: 'form-validation', element: <FormValidation /> },
        { path: 'table-bootstrap-basic', element: <BootstrapTable /> },
        { path: 'table-datatable-basic', element: <DataTable /> },
        { path: 'empty-page', element: <EmptyPage /> },
        { path: '/role/list', element: <RoleList /> },
        { path: '/role/add-role', element: <AddRole /> },
        { path: '/role/edit/:id', element: <RoleEdit /> },
        { path: '/permission/list', element: <PermissionList /> },
        { path: '/permission/add-permission', element: <PermissionForm /> },
        { path: '/role/assign/:id', element: <AssignPermission /> },

        { path: '/manager/pending-payments', element: <ManagerPendingPayments /> },
        { path: '/manager/approved-payments', element: <ManagerApprovedPayments /> },
        { path: '/account/paid-payments', element: <AccountPaidPayments /> },
        { path: '/account/pending-payments', element: <AccountPendingPayments /> },

        { path: '/Intervention-Reports', element: <InterventionReports /> },


        { path: '/AdvancePaymentDashboard', element: <AdvancePaymentDashboard /> },

        { path: '/Paid-Expense', element: <PaidExpense /> },
        { path: '/User-Expense-Reports', element: <UserExpenseReports /> },
        { path: '/User-Detail-Reports', element: <UserDetailReport /> },


        // account 

        { path: '/account/credit-note', element: <CreditNote /> },
        { path: '/account/debit-note', element: <DebitNote /> },
        { path: '/account/Delivery-Challan', element: <DeliveryChallan /> },
        { path: '/account/Expense', element: <Expense /> },
        { path: '/account/Material-Transfer', element: <MaterialTransfer /> },
        { path: '/account/Payment', element: <Payment /> },
        { path: '/account/Purchase-Invoice', element: <PurchaseInvoice /> },
        { path: '/account/Sales-Invoice', element: <SalesInvoice /> },
        { path: '/account/Product-Detail', element: <ProductDetail /> },
        { path: '/account/Company-Detail', element: <CompanyDetail /> },
        { path: '/account/dashboard', element: <AccountDashboard /> },
        { path: '/account/reports', element: <AccountReports /> },

     ];

    return (
        <>
            <Routes>
                {/* <Route path="/" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>}
                /> */}

                <Route path="/" element={<Navigate to="/login" replace />} />



                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
                />


                <Route path="/register" element={
                    <PublicRoute>
                        <Registration />
                    </PublicRoute>
                }
                />
                <Route path="/error-400" element={<Error400 />} />
                <Route
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >
                    {protectedMenu.map((item, index) => (
                        <Route key={index} path={item.path} element={item.element} />
                    ))}
                </Route>


                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <ScrollToTop />
        </>
    );
};


function MainLayout() {
    const { menuToggle, sidebariconHover } = useContext(ThemeContext);
    const location = useLocation();

    // ✅ ADD THIS BLOCK
        useEffect(() => {
            const timeout = setTimeout(() => {
                const token = localStorage.getItem("token");

                if (token && isTokenExpired(token)) {
                    localStorage.clear();
                    window.location.replace("/login");
                }
            }, 2000);

            return () => clearTimeout(timeout);
        }, []);

    return (
        <div
            id="main-wrapper"
            className={`show ${sidebariconHover ? "iconhover-toggle" : ""} ${menuToggle ? "menu-toggle" : ""}`}
        >
            <Nav />
            <div className="content-body app-content-body">
                <div className="container-fluid app-page-container">
                    <Outlet key={getOutletKey(location)} />
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default Markup;