import { useReducer, useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MenuList } from "./Menu";
import { Collapse } from "react-bootstrap";
import { ThemeContext } from "../../../context/ThemeContext";
import { getMyPermissions } from "../../modules/RolePermission/roleApi";


const reducer = (state, newState) => ({ ...state, ...newState });

const initialState = {
  active: "",
  activeSubmenu: "",
};

function SideBar() {
  const { iconHover } = useContext(ThemeContext);

  const [state, setState] = useReducer(reducer, initialState);
  const [menuData, setMenuData] = useState(MenuList);

  //   FETCH PERMISSIONS
  useEffect(() => {
    fetchPermissions();
  }, []);

 const fetchPermissions = async () => {
  try {
    const res = await getMyPermissions();

    const perms = res?.data?.data || [];
    const permKeys = perms.map((p) => p.key);

    console.log("User Permissions:", permKeys); // 🔍 debug

    const filteredMenu = MenuList
      //   FIRST: filter parent menus (IMPORTANT for dashboards)
      .filter((menu) => {
        // allow if no permission required
        if (!menu.permission) return true;

        return permKeys.includes(menu.permission);
      })
      //   SECOND: filter submenus
      .map((menu) => {
        if (!menu.content) return menu;

        const filteredSub = menu.content.filter((sub) => {
          if (!sub.permission) return true;

          return permKeys.includes(sub.permission);
        });

        return { ...menu, content: filteredSub };
      })
      //   THIRD: remove empty menus
      .filter((menu) => !menu.content || menu.content.length > 0);

    //   FINAL: no unsafe fallback
    setMenuData(filteredMenu);

  } catch (error) {
    console.error("Sidebar permission error:", error);

    // ❗ safer fallback → show NOTHING instead of full access
    setMenuData([]);
  }
};

  // ACTIVE MENU
  const handleMenuActive = (status) => {
    setState({ active: state.active === status ? "" : status });
  };

  const handleSubmenuActive = (status) => {
    setState({
      activeSubmenu: state.activeSubmenu === status ? "" : status,
    });
  };

  let path = window.location.pathname.split("/").pop();

  return (
    <div className={`ic-sidenav ${iconHover}`}>
      <div className="ic-sidenav-scroll">
        <ul className="metismenu" id="menu">

          {menuData.map((data, index) => {

            if (data.classsChange === "menu-title") {
              return (
                <li className="menu-title" key={index}>
                  {data.title}
                </li>
              );
            }

            return (
              <li
                key={index}
                className={state.active === data.title ? "mm-active" : ""}
              >
                {data.content ? (
                  <>
                    {/* MAIN MENU */}
                    <Link
                      to="#"
                      className="has-arrow"
                      onClick={() => handleMenuActive(data.title)}
                    >
                      {data.iconStyle}
                      <span className="nav-text">{data.title}</span>
                    </Link>

                    <Collapse in={state.active === data.title}>
                      <ul className="mm-show">

                        {data.content.map((sub, i) => (
                          <li key={i}>
                            <Link
                              to={sub.to}
                              className={path === sub.to ? "mm-active" : ""}
                              onClick={() => handleSubmenuActive(sub.title)}
                            >
                              {sub.title}
                            </Link>
                          </li>
                        ))}

                      </ul>
                    </Collapse>
                  </>
                ) : (
                  <Link to={data.to}>
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