import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemeContext } from "../../../context/ThemeContext";
import { getDeveloperHomeRoute, isDeveloperUser } from "../../../utils/developer";
import { getTenantBranding, tenantLogoUrl } from "../../modules/Tenant/tenantApi";
import defaultLogo from "../../../assets/images/logo.png";

export function NavMenuToggle() {
  let mainwrapper = document.querySelector("#main-wrapper");
  if (mainwrapper.classList.contains("menu-toggle")) {
    mainwrapper.classList.remove("menu-toggle");
  } else {
    mainwrapper.classList.add("menu-toggle");
  }
}

function getDashboardRoute() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "/user-dashboard";

    const user = JSON.parse(raw);
    if (!user) return "/user-dashboard";

    if (isDeveloperUser(user)) return getDeveloperHomeRoute();

    const roleId = user?.role_id;

    if (roleId === 1) return "/admin-dashboard";
    if (roleId === 2) return "/manager-dashboard";
    if (roleId === 3) return "/user-dashboard";

    return "/user-dashboard";
  } catch (error) {
    console.error("getDashboardRoute:", error);
    return "/user-dashboard";
  }
}

const NavHeader = () => {
  const [toggle, setToggle] = useState(false);
  const { openMenuToggle, theme } = useContext(ThemeContext);
  const [brandName, setBrandName] = useState("KLK Ventures");
  const [brandLogo, setBrandLogo] = useState(defaultLogo);

  useEffect(() => {
    if (isDeveloperUser()) {
      setBrandName("KLK Ventures");
      setBrandLogo(defaultLogo);
      return undefined;
    }

    let cancelled = false;

    const loadBranding = async () => {
      try {
        const branding = await getTenantBranding();
        if (cancelled) return;

        if (branding) {
          setBrandName(branding.tenant_showing_name || branding.name || "KLK Ventures");
          setBrandLogo(
            branding.tenant_logo ? tenantLogoUrl(branding.tenant_logo) : defaultLogo
          );
        } else {
          setBrandName("KLK Ventures");
          setBrandLogo(defaultLogo);
        }
      } catch (error) {
        console.error("Failed to load company branding:", error);
        if (!cancelled) {
          setBrandName("KLK Ventures");
          setBrandLogo(defaultLogo);
        }
      }
    };

    loadBranding();
    window.addEventListener("tenant-branding-updated", loadBranding);

    return () => {
      cancelled = true;
      window.removeEventListener("tenant-branding-updated", loadBranding);
    };
  }, []);

  return (
    <div className="nav-header">
      <Link to={getDashboardRoute()} className="brand-logo">
        <div className="logo-wrapper">
          <img src={brandLogo} alt="Company logo" />
          <div className={`brand-title ${theme === "dark" ? "text-white" : "text-dark"}`}>
            {brandName}
          </div>
        </div>
      </Link>

      <div
        className="nav-control"
        onClick={() => {
          setToggle(!toggle);
          openMenuToggle();
          NavMenuToggle();
        }}
      >
        <div className={`hamburger ${toggle ? "is-active" : ""}`}>
          <span className="line"></span>
          <span className="line"></span>
          <span className="line"></span>
        </div>
      </div>
    </div>
  );
};

export default NavHeader;
