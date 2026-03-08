import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import Drawer from "../components/ui/Drawer";
import { useAuth } from "../context/AuthContext";
import { useSalon } from "../context/SalonContext";
import { HorizontaLDots } from "../icons";
import { getNavigationSections, isNavigationItemActive } from "../navigation/appNavigation";

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { isOwner, isStaff, isManager } = useAuth();
  const { selectedSalon, salons, selectSalon } = useSalon();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isSimpleEmployee = isStaff && !isManager && !isOwner;
  const navigation = useMemo(
    () => getNavigationSections({ isOwner, isSimpleEmployee }),
    [isOwner, isSimpleEmployee]
  );

  const primaryItems = navigation.mobilePrimary.slice(0, 4);
  const secondaryItems = navigation.mobileSecondary;
  const isMoreActive = secondaryItems.some((item) => isNavigationItemActive(item, location.pathname));

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-[90] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-2 lg:hidden"
        aria-hidden={false}
      >
        <nav className="mx-auto flex max-w-md items-center justify-between rounded-[28px] border border-gray-200/80 bg-white/92 px-2 py-2 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-gray-700/80 dark:bg-gray-900/92">
          {primaryItems.map((item) => {
            const isActive = isNavigationItemActive(item, location.pathname);

            return (
              <Link
                key={item.name}
                to={item.path ?? "/"}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                  {item.icon}
                </span>
                <span className="truncate">{item.mobileLabel ?? item.name}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-medium transition-colors ${
              isMoreActive || isMoreOpen
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-500 dark:text-gray-400"
            }`}
            aria-expanded={isMoreOpen}
            aria-label="Ouvrir plus d'options"
          >
            <span className="flex h-5 w-5 items-center justify-center">
              <HorizontaLDots className="h-5 w-5 rotate-90" />
            </span>
            <span>Plus</span>
          </button>
        </nav>
      </div>

      <Drawer isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} title="Navigation">
        <div className="space-y-6 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]">
          {salons.length > 0 && (
            <section>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Salon actif
              </div>
              <div className="grid gap-2">
                {salons.map((salon) => {
                  const isSelected = selectedSalon?.id === salon.id;

                  return (
                    <button
                      key={salon.id}
                      type="button"
                      onClick={() => {
                        selectSalon(salon.id);
                        setIsMoreOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors ${
                        isSelected
                          ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                          : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <span className="truncate">{salon.name}</span>
                      {isSelected && <span className="text-xs font-semibold">Actif</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {secondaryItems.length > 0 && (
            <section>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                Raccourcis
              </div>
              <div className="grid gap-2">
                {secondaryItems.map((item) => {
                  const isActive = isNavigationItemActive(item, location.pathname);

                  if (item.disabled || !item.path) {
                    return (
                      <div
                        key={item.name}
                        className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-4 py-3 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500"
                      >
                        <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                        <span className="ml-auto text-xs font-medium uppercase">Bientot</span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMoreOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900"
                          : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </Drawer>
    </>
  );
};

export default MobileBottomNav;
