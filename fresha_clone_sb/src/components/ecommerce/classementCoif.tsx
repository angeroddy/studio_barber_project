import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";

// Define the TypeScript interface for the hairdressers
interface Coiffeur {
  id: number;
  rank: number;
  name: string;
  avatar?: string;
  appointments: number; // Nombre de rendez-vous
  revenue: number; // Chiffre d'affaires
  rating: number; // Note moyenne
}

// Define the table data for hairdressers
const tableData: Coiffeur[] = [
  {
    id: 1,
    rank: 1,
    name: "Sophie Martin",
    appointments: 45,
    revenue: 2850,
    rating: 4.9,
  },
  {
    id: 2,
    rank: 2,
    name: "Marc Dubois",
    appointments: 38,
    revenue: 2340,
    rating: 4.8,
  },
  {
    id: 3,
    rank: 3,
    name: "Julie Leclerc",
    appointments: 35,
    revenue: 2150,
    rating: 4.7,
  },
  {
    id: 4,
    rank: 4,
    name: "Thomas Bernard",
    appointments: 32,
    revenue: 1980,
    rating: 4.6,
  },
  {
    id: 5,
    rank: 5,
    name: "Emma Petit",
    appointments: 28,
    revenue: 1750,
    rating: 4.5,
  },
];

export default function ClassementCoif() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          classement des coiffeurs
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
                Rang
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-800 text-start text-theme-sm dark:text-white/90"
              >
                Coiffeur
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-800 text-center text-theme-sm dark:text-white/90"
              >
                Rendez-vous
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-800 text-center text-theme-sm dark:text-white/90"
              >
                Chiffre d'affaires
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-800 text-center text-theme-sm dark:text-white/90"
              >
                Note
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((coiffeur) => (
              <TableRow key={coiffeur.id}>
                <TableCell className="py-4 text-gray-800 text-theme-sm dark:text-white/90">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 font-semibold">
                    {coiffeur.rank}
                  </div>
                </TableCell>
                <TableCell className="py-4 text-gray-800 text-theme-sm dark:text-white/90">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                      {coiffeur.name.charAt(0)}
                    </div>
                    <span className="font-medium">{coiffeur.name}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-gray-800 text-center text-theme-sm dark:text-white/90">
                  {coiffeur.appointments}
                </TableCell>
                <TableCell className="py-4 text-gray-800 text-center text-theme-sm dark:text-white/90">
                  {coiffeur.revenue.toLocaleString('fr-FR')} €
                </TableCell>
                <TableCell className="py-4 text-gray-800 text-center text-theme-sm dark:text-white/90">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{coiffeur.rating}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
