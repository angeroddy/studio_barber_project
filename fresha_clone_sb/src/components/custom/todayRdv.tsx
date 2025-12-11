
export default function TodayRdv() {
    return (
        <div className="rounded-2xl border border- gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
            <h1 className="font-bold text-xl">Vos rendez-vous à venir aujourd'hui</h1>
            <div className="flex mt-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="left_date flex flex-col justify-center items-center">
                    <span className="font-semibold text-[20px]">27</span>
                    <span>Oct.</span>
                </div>
                <div className="right_info flex flex-col justify-center items-start">
                    <span className="opacity-50"> lundi. 17:15 </span>
                    <span className="font-bold text-[18px]">Coupe</span>
                    <span className="opacity-50">Avec rendez-vous, 45 minutes avec Djessé</span>
                </div>
            </div>
            <div className="flex mt-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="left_date flex flex-col justify-center items-center">
                    <span className="font-semibold text-[20px]">27</span>
                    <span>Oct.</span>
                </div>
                <div className="right_info flex flex-col justify-center items-start">
                    <span className="opacity-50"> lundi. 17:15 </span>
                    <span className="font-bold text-[18px]">Coupe</span>
                    <span className="opacity-50">Avec rendez-vous, 45 minutes avec Djessé</span>
                </div>
            </div>
        </div>
    );
}
