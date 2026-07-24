import { useReducer, useContext, useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MenuList } from "./Menu";
import { Collapse } from "react-bootstrap";
import { ThemeContext } from "../../../context/ThemeContext";
import { getMyPermissions } from "../../modules/RolePermission/roleApi";
import { pathsMatch, NAV_RESET_STATE_KEY } from "../../../utils/navUtils";

const reducer = (state, newState) => ({ ...state, ...newState });

const initialState = {
  active: "",
  activeSubmenu: "",
};

function SideBar() {
  const { iconHover } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [state, setState] = useReducer(reducer, initialState);
  const [menuData, setMenuData] = useState(MenuList);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await getMyPermissions();
      const perms = res?.data?.data || [];
      const permKeys = perms.map((p) => p.key);

      const filteredMenu = MenuList.filter((menu) => {
        if (menu.type === "section") return true;
        if (!menu.permission) return true;
        return permKeys.includes(menu.permission);
      })
        .map((menu) => {
          if (!menu.content) return menu;

          const filteredSub = menu.content.filter((sub) => {
            if (!sub.permission) return true;
            return permKeys.includes(sub.permission);
          });

          return { ...menu, content: filteredSub };
        })
        .filter((menu) => {
          if (menu.type === "section") return true;
          return !menu.content || menu.content.length > 0;
        })
        .filter((menu, index, arr) => {
          if (menu.type !== "section") return true;
          const nextItem = arr[index + 1];
          return nextItem && nextItem.type !== "section";
        });

      setMenuData(filteredMenu);
    } catch (error) {
      console.error("Sidebar permission error:", error);
      setMenuData([]);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    let activeMenu = "";

    menuData.forEach((menu) => {
      if (!menu.content) return;
      const hasActiveChild = menu.content.some((sub) =>
        pathsMatch(location.pathname, sub.to)
      );
      if (hasActiveChild) activeMenu = menu.title;
    });

    setState({ active: activeMenu, activeSubmenu: "" });
  }, [location.pathname, menuData]);

  const handleMenuActive = (status) => {
    setState({ active: state.active === status ? "" : status });
  };

  const handleSubmenuActive = (status) => {
    setState({
      activeSubmenu: state.activeSubmenu === status ? "" : status,
    });
  };

  const handleSidebarNav = (to, e) => {
    if (!to || to === "#") return;
    if (pathsMatch(location.pathname, to)) {
      e.preventDefault();
      navigate(to, { replace: true, state: { [NAV_RESET_STATE_KEY]: Date.now() } });
    }
  };

  const isSection = (item) => item.type === "section" || item.classsChange === "menu-title";

  return (
    <div className={`ic-sidenav app-sidebar ${iconHover}`}>
      <div className="ic-sidenav-scroll">
        <ul className="metismenu" id="menu">
          {menuData.map((data, index) => {
            if (isSection(data)) {
              return (
                <li className="menu-title app-menu-section" key={`section-${data.title}-${index}`}>
                  <span>{data.title}</span>
                </li>
              );
            }

            const isGroupActive =
              state.active === data.title ||
              data.content?.some((sub) => pathsMatch(location.pathname, sub.to));

            return (
              <li
                key={`${data.title}-${index}`}
                className={isGroupActive ? "mm-active" : ""}
              >
                {data.content ? (
                  <>
                    <Link
                      to="#"
                      className={`has-arrow ${isGroupActive ? "mm-active" : ""}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleMenuActive(data.title);
                      }}
                    >
                      {data.iconStyle}
                      <span className="nav-text">{data.title}</span>
                    </Link>

                    <Collapse in={state.active === data.title}>
                      <ul className="mm-show">
                        {data.content.map((sub, i) => {
                          const subActive = pathsMatch(location.pathname, sub.to);
                          return (
                            <li key={`${sub.title}-${i}`} className={subActive ? "mm-active" : ""}>
                              <Link
                                to={sub.to}
                                className={subActive ? "mm-active" : ""}
                                onClick={(e) => {
                                  handleSidebarNav(sub.to, e);
                                  handleSubmenuActive(sub.title);
                                }}
                              >
                                {sub.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </Collapse>
                  </>
                ) : (
                  <Link
                    to={data.to}
                    className={pathsMatch(location.pathname, data.to) ? "mm-active" : ""}
                    onClick={(e) => handleSidebarNav(data.to, e)}
                  >
                    {data.iconStyle}
                    <span className="nav-text">{data.title}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default SideBar;
