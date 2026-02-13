import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import logo from "../assets/4x/log.png";
// Assume these icons are imported from an icon library
import {
  GridIcon,
  CalenderIcon,
  BookingIcon,
  GroupIcon,
  ScissorsIcon,
  UsersIcon,
  StoreIcon,
  PieChartIcon,
  SettingsIcon,
  BellIcon,
  ChevronDownIcon,
  HorizontaLDots,
  TimeIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useSalon } from "../context/SalonContext";
import { useAuth } from "../context/AuthContext";
import type { StaffUser } from "../services/staffAuth.service";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  disabled?: boolean;
};

// Icône pour les absences
const AbsenceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <CalenderIcon />,
    name: "Calendrier",
    path: "/calendar",
  },
  {
    icon: <AbsenceIcon />,
    name: "Absences",
    path: "/absences",
  },
];

const gestionItems: NavItem[] = [
  {
    icon: <GroupIcon />,
    name: "Clients",
    path: "/clients",
  },
  {
    icon: <ScissorsIcon />,
    name: "Services",
    path: "/services",
  },
  {
    icon: <UsersIcon />,
    name: "Équipe",
    path: "/equipe",
  },
  {
    icon: <TimeIcon />,
    name: "Planification",
    path: "/planification",
  },
  {
    icon: <AbsenceIcon />,
    name: "Gestion des Absences",
    path: "/gestion-absences",
  },
  {
    icon: <StoreIcon />,
    name: "Mes Salons",
    path: "/salons",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Statistiques",
    path: "/statistiques",
    disabled: true,
  },
  {
    icon: <SettingsIcon />,
    name: "Paramètres",
    path: "/parametres",
    // Activé pour les owners uniquement
  },
  {
    icon: <BellIcon />,
    name: "Notifications",
    path: "/notifications",
    disabled: true,
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { selectedSalon, salons, selectSalon } = useSalon();
  const { user, isStaff, isOwner, isManager } = useAuth();
  const location = useLocation();

  // Déterminer si l'utilisateur est un simple employé (pas manager, pas owner)
  const isSimpleEmployee = isStaff && !isManager && !isOwner;

  const [isSalonDropdownOpen, setIsSalonDropdownOpen] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "gestion" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "gestion", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : menuType === "gestion" ? gestionItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
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
  }, [location, isActive]);

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

  const renderMenuItems = (items: NavItem[], menuType: "main" | "gestion" | "others") => (
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
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
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
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </div>
              ) : (
                <Link
                  to={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              )
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
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
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
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
                              isActive(subItem.path)
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
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
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
          {isExpanded || isHovered || isMobileOpen ? (
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
        {/* Salon Selector - Hidden for simple employees */}
        {!isSimpleEmployee && (isExpanded || isHovered || isMobileOpen) && salons.length > 0 && (
          <div className="relative px-3 py-3 mb-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsSalonDropdownOpen(!isSalonDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center gap-2">

                <span className="truncate">{selectedSalon?.name || 'Sélectionner un salon'}</span>
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

        {/* Display salon name for simple employees (read-only) */}
        {isSimpleEmployee && (isExpanded || isHovered || isMobileOpen) && user && (
          <div className="px-3 py-3 mb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">
              <div className="flex items-center gap-2">
                <span className="truncate">{(user as StaffUser).salon?.name}</span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 mb-6">
          <div className="flex flex-col gap-6">
            {/* Main Menu Items */}
            <div>
              {renderMenuItems(
                isSimpleEmployee
                  ? navItems // Afficher tous les items y compris Absences pour les employés simples
                  : navItems.filter(item => item.name !== "Absences"), // Masquer Absences pour les autres
                "main"
              )}
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
                  {isExpanded || isHovered || isMobileOpen ? (
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
