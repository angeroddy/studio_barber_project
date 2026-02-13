import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { useSalon } from "../../context/SalonContext";
import { Link } from "react-router-dom";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import TodayRdv from "../../components/custom/todayRdv";
import ClassementCoif from "../../components/ecommerce/classementCoif";
import { useDashboardMetrics } from "../../hooks/useDashboardMetrics";

export default function Home() {
    const { isStaff, isManager, isOwner, user } = useAuth();
    const { selectedSalon } = useSalon();
    const isSimpleEmployee = isStaff && !isManager && !isOwner;

    // Charger les métriques pour les propriétaires/managers
    const { metrics, loading, error } = useDashboardMetrics(
        selectedSalon?.id || ''
    );

    return (
        <>
            <PageMeta
                title="Espace Employé | Fresha Clone"
                description="Dashboard employé"
            />
            <div className="space-y-6">
                {/* Bienvenue */}
                <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="px-6.5 py-6">
                        <h2 className="text-2xl font-semibold text-black dark:text-white mb-2">
                            Bienvenue {user ? (user as any).firstName : ''}
                        </h2>
                        <p className="text-bodydark">
                            {isSimpleEmployee
                                ? "Consultez votre planning dans le calendrier et gérez vos congés."
                                : selectedSalon
                                ? `Vue d'ensemble de ${selectedSalon.name}`
                                : "Sélectionnez un salon pour voir les métriques."}
                        </p>
                    </div>
                </div>

                {/* Dashboard pour employés simples */}
                {isSimpleEmployee && (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <Link to="/calendrier" className="block">
                            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="px-6.5 py-6 flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary bg-opacity-10">
                                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-black dark:text-white">
                                            Mon Calendrier
                                        </h3>
                                        <p className="text-bodydark text-sm">
                                            Voir mes rendez-vous et mon planning
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link to="/absences" className="block">
                            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="px-6.5 py-6 flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success bg-opacity-10">
                                        <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-black dark:text-white">
                                            Mes Absences
                                        </h3>
                                        <p className="text-bodydark text-sm">
                                            Déclarer et gérer mes congés
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Dashboard pour propriétaires/managers */}
                {!isSimpleEmployee && selectedSalon && (
                    <div className="space-y-6">
                        {/* Message d'erreur */}
                        {error && (
                            <div className="rounded-sm border border-danger bg-danger bg-opacity-10 p-4">
                                <p className="text-danger">
                                    Erreur lors du chargement des métriques: {error}
                                </p>
                            </div>
                        )}

                        {/* Métriques principales */}
                        <EcommerceMetrics
                            newClientsWeek={metrics.newClientsWeek}
                            newClientsWeekChange={metrics.newClientsWeekChange}
                            bookingsToday={metrics.bookingsToday}
                            bookingsTodayChange={metrics.bookingsTodayChange}
                            revenueToday={metrics.revenueToday}
                            revenueTodayChange={metrics.revenueTodayChange}
                            occupancyRateToday={metrics.occupancyRateToday}
                            occupancyRateTodayChange={metrics.occupancyRateTodayChange}
                            loading={loading}
                        />

                        {/* Rendez-vous du jour et Classement */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <TodayRdv />
                            <ClassementCoif />
                        </div>
                    </div>
                )}

                {/* Message si aucun salon sélectionné */}
                {!isSimpleEmployee && !selectedSalon && (
                    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                        <div className="px-6.5 py-6 text-center">
                            <p className="text-bodydark">
                                Veuillez sélectionner un salon dans la sidebar pour voir les métriques.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
