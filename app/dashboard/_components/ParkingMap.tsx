import { SPOT_STATUS, SPOT_TYPES } from "@/components/SpotsStatusAndTypes";
import { ParkingSpot } from "@/lib/generated/prisma/client";
import { SpotType } from "@/lib/generated/prisma/enums";
import { Accessibility, MapPin, Zap } from "lucide-react";

type ParkingMapProps = {
  spots: ParkingSpot[];
  selectedType: SpotType | null;
  onSpotClick: (spot: ParkingSpot) => void;
};

export const ParkingMap = ({
  spots,
  selectedType,
  onSpotClick,
}: ParkingMapProps) => {

  const filteredSpots = selectedType
    ? spots.filter((s) => s.type === selectedType)
    : spots;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Mapa do Estacionamento
        </h3>
        <MapPin className="w-5 h-5 text-violet-400" />
      </div>

      <div className="grid grid-cols-10 gap-2">
        {filteredSpots.slice(0, 50).map((spot) => (
          <button
            key={spot.id}
            onClick={() => onSpotClick(spot)}
            className={`
              aspect-square rounded-lg flex items-center justify-center text-xs font-bold
              transition-all duration-200 hover:scale-110 hover:shadow-lg
              ${SPOT_STATUS[spot.status].bgColor}
              ${spot.type === "PCD" ? "border-2 border-blue-400" : ""}
              ${spot.type === "ELECTRIC" ? "border-2 border-green-400" : ""}
            `}
            title={`${spot.number} - ${SPOT_TYPES[spot.type].label} - ${
              SPOT_STATUS[spot.status].label
            }`}
          >
            {spot.type === "PCD" ? (
              <Accessibility className="w-3 h-3" />
            ) : spot.type === "ELECTRIC" ? (
              <Zap className="w-3 h-3" />
            ) : (
              spot.number.slice(-2)
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-xs text-gray-400">Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-xs text-gray-400">Ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span className="text-xs text-gray-400">Reservado</span>
        </div>
      </div>
    </div>
  );
};
