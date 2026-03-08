import type { ReactNode } from "react";
import {
  BellIcon,
  CalenderIcon,
  GridIcon,
  GroupIcon,
  PieChartIcon,
  ScissorsIcon,
  SettingsIcon,
  StoreIcon,
  TimeIcon,
  UsersIcon,
} from "../icons";

export type NavigationAudience = "all" | "staff-advanced";
export type NavigationSection = "main" | "gestion" | "others";

export type NavigationContext = {
  isSimpleEmployee: boolean;
  isOwner: boolean;
};

export type NavigationItem = {
  name: string;
  path?: string;
  matchPaths?: string[];
  icon: ReactNode;
  section: NavigationSection;
  audience: NavigationAudience;
  disabled?: boolean;
  mobilePrimary?: boolean;
  mobileLabel?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  getPath?: (context: NavigationContext) => string;
};

export const AbsenceIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const navigationItems: NavigationItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    matchPaths: ["/"],
    section: "main",
    audience: "all",
    mobilePrimary: true,
    mobileLabel: "Accueil",
  },
  {
    icon: <CalenderIcon />,
    name: "Calendrier",
    path: "/calendar",
    matchPaths: ["/calendar", "/calendrier"],
    section: "main",
    audience: "all",
    mobilePrimary: true,
  },
  {
    icon: <GroupIcon />,
    name: "Clients",
    path: "/clients",
    section: "gestion",
    audience: "staff-advanced",
    mobilePrimary: true,
  },
  {
    icon: <UsersIcon />,
    name: "Equipe",
    path: "/equipe",
    section: "gestion",
    audience: "staff-advanced",
    mobilePrimary: true,
  },
  {
    icon: <ScissorsIcon />,
    name: "Services",
    path: "/services",
    section: "gestion",
    audience: "staff-advanced",
  },
  {
    icon: <TimeIcon />,
    name: "Planification",
    path: "/planification",
    section: "gestion",
    audience: "staff-advanced",
  },
  {
    icon: <AbsenceIcon />,
    name: "Gestion des Absences",
    section: "gestion",
    audience: "staff-advanced",
    getPath: ({ isOwner }) => (isOwner ? "/gestion-absences" : "/absences"),
  },
  {
    icon: <StoreIcon />,
    name: "Mes Salons",
    path: "/salons",
    section: "gestion",
    audience: "staff-advanced",
  },
  {
    icon: <PieChartIcon />,
    name: "Statistiques",
    path: "/statistiques",
    section: "others",
    audience: "staff-advanced",
    disabled: true,
  },
  {
    icon: <SettingsIcon />,
    name: "Parametres",
    path: "/parametres",
    section: "others",
    audience: "staff-advanced",
  },
  {
    icon: <BellIcon />,
    name: "Notifications",
    path: "/notifications",
    section: "others",
    audience: "staff-advanced",
    disabled: true,
  },
];

export const getNavigationItems = (context: NavigationContext) =>
  navigationItems
    .filter((item) => item.audience === "all" || !context.isSimpleEmployee)
    .map((item) => ({
      ...item,
      path: item.getPath ? item.getPath(context) : item.path,
    }));

export const isNavigationItemActive = (item: Pick<NavigationItem, "path" | "matchPaths">, pathname: string) => {
  const paths = item.matchPaths ?? (item.path ? [item.path] : []);
  return paths.includes(pathname);
};

export const getNavigationSections = (context: NavigationContext) => {
  const items = getNavigationItems(context);

  return {
    main: items.filter((item) => item.section === "main"),
    gestion: items.filter((item) => item.section === "gestion"),
    others: items.filter((item) => item.section === "others"),
    mobilePrimary: items.filter((item) => item.mobilePrimary),
    mobileSecondary: items.filter((item) => !item.mobilePrimary),
  };
};
