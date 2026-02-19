import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { usePopularServices } from "../../hooks/usePopularServices";

interface RecentOrdersProps {
  salonId: string;
}

export default function RecentOrders({ salonId }: RecentOrdersProps) {
  const { services, loading } = usePopularServices(salonId);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 animate-pulse">
        <div className="mb-6">
          <div className="h-5 bg-gray-200 rounded dark:bg-gray-700 w-48" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-24" />
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-12" />
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Prestations les plus populaires
        </h3>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          Aucune prestation ce mois-ci
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-b">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-white/90"
                >
                  Prestation
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-800 text-center text-theme-sm dark:text-white/90"
                >
                  Ce mois-ci
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-800 text-center text-theme-sm dark:text-white/90"
                >
                  Le mois dernier
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="py-4 text-gray-800 text-theme-sm dark:text-white/90">
                    {service.name}
                  </TableCell>
                  <TableCell className="py-4 text-gray-800 text-center text-theme-sm dark:text-white/90">
                    {service.currentMonth}
                  </TableCell>
                  <TableCell className="py-4 text-gray-800 text-center text-theme-sm dark:text-white/90">
                    {service.lastMonth}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
