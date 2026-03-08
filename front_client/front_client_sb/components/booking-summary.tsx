import Image from "next/image";
import { Button } from "./ui/button";

interface BookingSummaryProps {
  salon?: {
    name: string;
    address: string;
    image: string;
  };
  service?: {
    name: string;
    duration: string;
    price: number;
  };
  professional?: {
    name: string;
  };
  date?: string;
  time?: string;
  total: number;
  onContinue?: () => void;
  continueDisabled?: boolean;
}

export function BookingSummary({
  salon,
  service,
  professional,
  date,
  time,
  total,
  onContinue,
  continueDisabled = false,
}: BookingSummaryProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6 shadow-sm">
      {salon && (
        <div className="flex items-start gap-3 mb-5 pb-5 border-b border-gray-100">
          {salon.image && (
            <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
              <Image
                src={salon.image}
                alt={salon.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="font-archivo font-black text-black text-sm">
              {salon.name}
            </h3>
            <p className="font-archivo text-xs text-gray-500 mt-1">
              {salon.address}
            </p>
          </div>
        </div>
      )}

      {!service && (
        <p className="font-archivo text-gray-400 text-sm mb-5">
          Aucune prestation sélectionnée
        </p>
      )}

      {service && (
        <div className="mb-5 pb-5 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-archivo font-bold text-black text-sm">{service.name}</p>
              <p className="font-archivo text-xs text-gray-500 mt-1">
                {service.duration}
                {professional && ` · ${professional.name}`}
              </p>
            </div>
            <p className="font-archivo font-black text-black text-sm">
              {service.price} €
            </p>
          </div>
        </div>
      )}

      {date && time && (
        <div className="mb-5 pb-5 border-b border-gray-100">
          <p className="font-archivo text-sm text-gray-600">
            <span className="font-bold text-black">{date}</span> à{" "}
            <span className="font-bold text-black">{time}</span>
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <span className="font-archivo font-black text-base text-black">
          Total
        </span>
        <span className="font-archivo font-black text-xl text-black">
          {total > 0 ? `${total} €` : "gratuit"}
        </span>
      </div>

      {onContinue && (
        <Button
          onClick={onContinue}
          disabled={continueDisabled}
          className="w-full bg-black hover:bg-gray-800 text-white font-archivo font-bold text-sm py-6 rounded-full transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Continuez
        </Button>
      )}
    </div>
  );
}
