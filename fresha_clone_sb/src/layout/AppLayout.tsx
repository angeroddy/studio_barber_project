import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { SalonProvider } from "../context/SalonContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="mx-auto max-w-(--breakpoint-2xl) p-3 pb-24 sm:p-4 sm:pb-28 md:p-6 lg:pb-6">
          <Outlet />
        </div>
        <MobileBottomNav />
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SalonProvider>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </SalonProvider>
  );
};

export default AppLayout;
