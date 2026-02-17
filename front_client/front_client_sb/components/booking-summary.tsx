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
    <div className="bg-white border border-black p-8 sticky top-6">
      {salon && (
        <div className="flex items-start gap-3 mb-6 pb-6 border-b border-gray-300">
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

      {!service && (
        <p className="font-archivo text-gray-500 text-sm mb-6">
          Aucune prestation selectionnee
        </p>
      )}

      {service && (
        <div className="mb-6 pb-6 border-b border-gray-300">
          <h4 className="font-archivo font-black text-black text-base mb-2 uppercase">
            {service.name}
          </h4>
          <p className="font-archivo text-sm text-gray-600">
            {service.duration}
            {professional && ` avec ${professional.name}`}
          </p>
          <p className="font-archivo font-black text-xl text-black mt-2">
            {service.price} EUR
          </p>
        </div>
      )}

      {date && time && (
        <div className="mb-6 pb-6 border-b border-gray-300">
          <p className="font-archivo text-sm text-gray-600">
            <span className="font-black text-black uppercase">{date}</span> a{" "}
            <span className="font-black text-black">{time}</span>
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <span className="font-archivo font-black text-xl text-black uppercase">
          Total
        </span>
        <span className="font-archivo font-black text-3xl text-black">
          {total > 0 ? `${total} EUR` : "gratuit"}
        </span>
      </div>

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
