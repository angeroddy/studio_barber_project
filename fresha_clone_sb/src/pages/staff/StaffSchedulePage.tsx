import { useState } from "react";
import StaffScheduleGrid from "./StaffScheduleGrid";

const StaffSchedulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"schedule" | "settings">("schedule");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête de la page */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Planification des horaires
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Gérez les horaires de travail de votre équipe
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "schedule"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Horaires hebdomadaires
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Paramètres
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "schedule" ? (
          <StaffScheduleGrid />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Paramètres de planification
            </h2>
            <p className="text-gray-600">
              Les paramètres de planification seront disponibles prochainement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffSchedulePage;
