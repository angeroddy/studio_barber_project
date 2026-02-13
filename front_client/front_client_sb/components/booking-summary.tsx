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
  services?: Array<{
    name: string;
    duration: string;
    price: number;
  }>;
  professional?: {
    name: string;
  };
  date?: string;
  time?: string;
  totalDuration?: string;
  total: number;
  onContinue?: () => void;
  continueDisabled?: boolean;
}

export function BookingSummary({
  salon,
  service,
  services,
  professional,
  date,
  time,
  totalDuration,
  total,
  onContinue,
  continueDisabled = false,
}: BookingSummaryProps) {
  const hasServices = services && services.length > 0;
  const hasSingleService = service && !hasServices;

  return (
    <div className="bg-white border-2 border-black p-8 sticky top-6">
      {/* Salon Info */}
      {salon && (
        <div className="flex items-start gap-3 mb-6 pb-6 border-b-2 border-gray-300">
          {salon.image && (
            <div className="relative w-16 h-16 flex-shrink-0">
              <Image
                src={salon.image}
                alt={salon.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="font-archivo font-black text-black text-base uppercase">
              {salon.name}
            </h3>
            <p className="font-archivo text-sm text-gray-600 mt-1">
              {salon.address}
            </p>
          </div>
        </div>
      )}

      {/* No selection message */}
      {!hasSingleService && !hasServices && (
        <p className="font-archivo text-gray-500 text-sm mb-6">
          Aucune prestation selectionnee
        </p>
      )}

      {/* Multiple Services Info */}
      {hasServices && (
        <div className="mb-6 pb-6 border-b-2 border-gray-300">
          <h4 className="font-archivo font-black text-black text-base mb-3 uppercase">
            Prestations sélectionnées ({services.length})
          </h4>
          <div className="space-y-3">
            {services.map((srv, index) => (
              <div key={index} className="bg-gray-50 p-3">
                <p className="font-archivo font-bold text-black text-sm uppercase">
                  {srv.name}
                </p>
                <p className="font-archivo text-xs text-gray-600 mt-1">
                  {srv.duration}
                </p>
                <p className="font-archivo font-black text-base text-black mt-1">
                  {srv.price} €
                </p>
              </div>
            ))}
          </div>
          {totalDuration && (
            <p className="font-archivo text-sm text-gray-600 mt-3">
              <span className="font-black text-black">Durée totale:</span> {totalDuration}
            </p>
          )}
        </div>
      )}

      {/* Single Service Info (legacy support) */}
      {hasSingleService && (
        <div className="mb-6 pb-6 border-b-2 border-gray-300">
          <h4 className="font-archivo font-black text-black text-base mb-2 uppercase">
            {service.name}
          </h4>
          <p className="font-archivo text-sm text-gray-600">
            {service.duration}
            {professional && ` avec ${professional.name}`}
          </p>
          <p className="font-archivo font-black text-xl text-black mt-2">
            {service.price} €
          </p>
        </div>
      )}

      {/* Date & Time */}
      {date && time && (
        <div className="mb-6 pb-6 border-b-2 border-gray-300">
          <p className="font-archivo text-sm text-gray-600">
            <span className="font-black text-black uppercase">{date}</span> à{" "}
            <span className="font-black text-black">{time}</span>
          </p>
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center mb-8">
        <span className="font-archivo font-black text-xl text-black uppercase">
          Total
        </span>
        <span className="font-archivo font-black text-3xl text-black">
          {total > 0 ? `${total} €` : "gratuit"}
        </span>
      </div>

      {/* Continue Button */}
      {onContinue && (
        <Button
          onClick={onContinue}
          disabled={continueDisabled}
          className="w-full bg-black hover:bg-[#DE2788] text-white font-archivo font-black text-base uppercase py-7 rounded-none transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          Continuez
        </Button>
      )}
    </div>
  );
}
