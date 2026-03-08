import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import logo from "../assets/4x/log.png";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useSalon } from "../context/SalonContext";
import { useAuth } from "../context/AuthContext";
import {
  getNavigationSections,
  isNavigationItemActive,
  type NavigationItem,
} from "../navigation/appNavigation";

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isMobile, isHovered, setIsHovered } = useSidebar();
  const { selectedSalon, salons, selectSalon } = useSalon();
  const { isStaff, isOwner, isManager } = useAuth();
  const location = useLocation();

  // Determiner si l'utilisateur est un simple employe (pas manager, pas owner)
  const isSimpleEmployee = isStaff && !isManager && !isOwner;
  const { main: navItems, gestion: gestionItems, others: othersItems } = useMemo(
    () =>
      getNavigationSections({
        isOwner,
        isSimpleEmployee,
      }),
    [isOwner, isSimpleEmployee]
  );

  const [isSalonDropdownOpen, setIsSalonDropdownOpen] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "gestion" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const shouldShowLabels = isExpanded || isHovered || isMobile;

  const isActive = useCallback(
    (item: Pick<NavigationItem, "path" | "matchPaths">) =>
      isNavigationItemActive(item, location.pathname),
    [location.pathname]
  );
  const isPathActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "gestion", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : menuType === "gestion" ? gestionItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isPathActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "gestion" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [gestionItems, isPathActive, navItems, othersItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "gestion" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavigationItem[], menuType: "main" | "gestion" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {shouldShowLabels && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {shouldShowLabels && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              nav.disabled ? (
                <div
                  className={`menu-item group opacity-50 cursor-not-allowed ${
                    "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size menu-item-icon-inactive`}
                  >
                    {nav.icon}
                  </span>
                  {shouldShowLabels && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </div>
              ) : (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {shouldShowLabels && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )
          )}
          {nav.subItems && shouldShowLabels && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isPathActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isPathActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isPathActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transform-gpu transition-transform duration-200 ease-out lg:transition-[width] lg:duration-300 z-50 border-r border-gray-200 will-change-transform
        w-[290px] 
        ${isExpanded || isHovered ? "lg:w-[290px]" : "lg:w-[90px]"}
        ${isMobileOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none lg:pointer-events-auto"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-center"
        }`}
      >
        <Link to="/">
          {shouldShowLabels ? (
            <>
              <img
                className="dark:hidden"
                src={logo}
                alt="Logo"
                width={100}
                height={40}
              />
              <img
                className="hidden dark:block"
                src={logo}
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src={logo}
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col h-full overflow-y-auto duration-300 ease-linear no-scrollbar">
        {/* Salon Selector */}
        {shouldShowLabels && salons.length > 0 && (
          <div className="relative px-3 py-3 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsSalonDropdownOpen(!isSalonDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-2">

                <span className="truncate">{selectedSalon?.name || 'Selectionner un salon'}</span>
              </div>
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isSalonDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isSalonDropdownOpen && (
              <div className="absolute left-3 right-3 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
                {salons.map((salon) => (
                  <button
                    key={salon.id}
                    onClick={() => {
                      selectSalon(salon.id);
                      setIsSalonDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg ${
                      selectedSalon?.id === salon.id
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 font-medium'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{salon.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 mb-6">
          <div className="flex flex-col gap-6">
            {/* Main Menu Items */}
            <div>
              {renderMenuItems(navItems, "main")}
            </div>

            {/* Gestion Section - Hidden for simple employees */}
            {!isSimpleEmployee && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 font-semibold px-3 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {shouldShowLabels ? (
                    "GESTION"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(gestionItems, "gestion")}
              </div>
            )}

            {/* Others Section - Hidden for simple employees */}
            {!isSimpleEmployee && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                {renderMenuItems(othersItems, "others")}
              </div>
            )}
          </div>
        </nav>

        {/* User Section */}
    
      </div>
    </aside>
  );
};

export default AppSidebar;
