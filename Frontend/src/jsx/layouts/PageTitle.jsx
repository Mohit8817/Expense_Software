import { Link } from "react-router-dom";

function PageTitle({ motherMenu, activeMenu, motherLink }) {
  return (
    <div className="row page-titles align-items-center">
      <div className="col-sm-6">
        <h4 className="page-title-heading">{activeMenu}</h4>
      </div>
      <div className="col-sm-6">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb justify-content-sm-end mb-0">
            <li className="breadcrumb-item">
              {motherLink ? (
                <Link to={motherLink}>{motherMenu}</Link>
              ) : (
                <span className="page-breadcrumb-root">{motherMenu}</span>
              )}
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {activeMenu}
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
}

export default PageTitle;
