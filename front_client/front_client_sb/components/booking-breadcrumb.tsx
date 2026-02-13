import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BookingBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function BookingBreadcrumb({ items }: BookingBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-8">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.href && !item.active ? (
            <Link
              href={item.href}
              className="text-gray-600 hover:text-[#DE2788] font-archivo transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className={`font-archivo ${
                item.active ? "text-black font-bold" : "text-gray-400"
              }`}
            >
              {item.label}
            </span>
          )}
          {index < items.length - 1 && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </div>
      ))}
    </nav>
  );
}
