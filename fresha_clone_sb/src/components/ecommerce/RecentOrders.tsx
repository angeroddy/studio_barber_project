import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

// Define the TypeScript interface for the table rows
interface Prestation {
  id: number;
  name: string;
  currentMonth: number;
  lastMonth: number;
}

// Define the table data using the interface
const tableData: Prestation[] = [
  {
    id: 1,
    name: "Coupe",
    currentMonth: 5,
    lastMonth: 0,
  },
  {
    id: 2,
    name: "Brushing",
    currentMonth: 2,
    lastMonth: 0,
  },
  {
    id: 3,
    name: "Couleur",
    currentMonth: 2,
    lastMonth: 0,
  },
];

export default function RecentOrders() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Prestations les plus populaires
        </h3>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
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

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((prestation) => (
              <TableRow key={prestation.id}>
                <TableCell className="py-4 text-gray-800 text-theme-sm dark:text-white/90">
                  {prestation.name}
                </TableCell>
                <TableCell className="py-4 text-gray-800 text-center text-theme-sm dark:text-white/90">
                  {prestation.currentMonth}
                </TableCell>
                <TableCell className="py-4 text-gray-800 text-center text-theme-sm dark:text-white/90">
                  {prestation.lastMonth}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
