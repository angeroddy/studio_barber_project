import { useTodayBookings } from "../../hooks/useTodayBookings";
import { fixTextEncoding } from "../../utils/textEncoding";

interface TodayRdvProps {
  salonId: string;
}

const DAYS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MONTHS = [
  "Jan.",
  "Fev.",
  "Mar.",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Aout",
  "Sep.",
  "Oct.",
  "Nov.",
  "Dec.",
];

export default function TodayRdv({ salonId }: TodayRdvProps) {
  const { bookings, loading } = useTodayBookings(salonId);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded dark:bg-gray-700 w-64 mb-4" />
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center gap-1">
                <div className="h-6 w-8 bg-gray-200 rounded dark:bg-gray-700" />
                <div className="h-4 w-8 bg-gray-200 rounded dark:bg-gray-700" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-24" />
                <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-32" />
                <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
      <h1 className="font-bold text-xl dark:text-white/90">Rendez-vous du jour</h1>

      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
          Aucun rendez-vous aujourd'hui
        </p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {bookings.map((booking) => {
            const start = new Date(booking.startTime);
            const day = start.getDate();
            const month = MONTHS[start.getMonth()];
            const dayName = DAYS[start.getDay()];
            const time = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

            const serviceName = booking.isMultiService
              ? fixTextEncoding(booking.bookingServices?.map((bs) => bs.service.name).join(", ")) || "Multi-services"
              : fixTextEncoding(booking.service?.name) || "Service";

            const staffName = booking.staff
              ? fixTextEncoding(`${booking.staff.firstName} ${booking.staff.lastName}`)
              : "Non assigne";

            return (
              <div key={booking.id} className="flex mt-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="left_date flex flex-col justify-center items-center min-w-10">
                  <span className="font-semibold text-[20px] text-gray-800 dark:text-white/90">{day}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{month}</span>
                </div>
                <div className="right_info flex flex-col justify-center items-start">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">{dayName} {time}</span>
                  <span className="font-bold text-[18px] text-gray-800 dark:text-white/90">{serviceName}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {booking.duration} min avec {staffName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
