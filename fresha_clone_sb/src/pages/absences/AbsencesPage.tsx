import PageMeta from "../../components/common/PageMeta";
import AbsenceForm from "../../components/absences/AbsenceForm";
import AbsenceList from "../../components/absences/AbsenceList";

export default function AbsencesPage() {
  return (
    <>
      <PageMeta
        title="Mes Absences | Fresha Clone"
        description="Gérer mes congés et absences"
      />
      <div className="space-y-6">
        {/* En-tête */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="px-6.5 py-4 border-b border-stroke dark:border-strokedark">
            <h2 className="text-xl font-semibold text-black dark:text-white">
              Gestion des Absences
            </h2>
            <p className="text-sm text-bodydark mt-1">
              Déclarez vos congés et suivez l'état de vos demandes
            </p>
          </div>
        </div>

        {/* Section Gestion des congés */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div>
            <AbsenceForm />
          </div>
          <div>
            <AbsenceList />
          </div>
        </div>
      </div>
    </>
  );
}
