import { SPOT_STATUS, SPOT_TYPES } from "@/components/SpotsStatusAndTypes";
import { ParkingSpot } from "@/lib/generated/prisma/client";
import { SpotType } from "@/lib/generated/prisma/enums";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

type TypeStats = {
  occupied: number;
  total: number;
  free: number;
  reserved: number;
  spots: ParkingSpot[];
};

type ParkingMapProps = {
  spots: any[];
  selectedType: any | null;
  onSpotClick: (spot: any) => void;
  selectedLot: string;
};
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
function shuffleDeterministic(array: any[], seedString: string) {
  const result = array.slice();

  // transforma seedString em número
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed += seedString.charCodeAt(i) * (i + 1);
  }

  const random = seededRandom(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export const ParkingMap = ({ spots, selectedType, onSpotClick, selectedLot }: ParkingMapProps) => {
  const [expandedTypes, setExpandedTypes] = useState(new Set(['GENERAL', 'PCD', 'ELECTRIC', 'MOTORCYCLE']));
  const [currentLot, setCurrentLot] = useState(selectedLot);

  const filteredSpots = useMemo(() => {
    let filtered = spots.filter(s => s.parkingLot === currentLot);
    if (selectedType) {
      filtered = filtered.filter(s => s.type === selectedType);
    }
    return filtered;
  }, [spots, selectedType, currentLot]);

  const typeStats = useMemo(() => {
    const types: any = {};
    const typeOrder = ['GENERAL', 'PCD', 'ELECTRIC', 'MOTORCYCLE'];

    typeOrder.forEach(type => {
      const typeSpots = filteredSpots.filter(spot => spot.type === type);
      if (typeSpots.length > 0) {
        types[type] = {
          total: typeSpots.length,
          free: typeSpots.filter(s => s.status === 'FREE').length,
          occupied: typeSpots.filter(s => s.status === 'OCCUPIED').length,
          reserved: typeSpots.filter(s => s.status === 'RESERVED').length,
          spots: shuffleDeterministic(typeSpots, type + currentLot)
        };
      }
    });

    return types;
  }, [filteredSpots]);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const allLots = [...new Set(spots.map(s => s.parkingLot))].sort();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-white">Mapa do Estacionamento</h3>
        </div>

        <div className="flex gap-2">
          {allLots.map(lot => {
            const lotSpots = spots.filter(s => s.parkingLot === lot);
            const occupancyRate = ((lotSpots.filter(s => s.status === 'OCCUPIED').length / lotSpots.length) * 100).toFixed(0);

            return (
              <button
                key={lot}
                onClick={() => setCurrentLot(lot)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${currentLot === lot
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
              >
                {lot} ({occupancyRate}%)
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(typeStats as Record<string, TypeStats>).map(([type, stats]) => {
          const isExpanded = expandedTypes.has(type);
          const occupancyRate = ((stats.occupied / stats.total) * 100).toFixed(0);
          const typeInfo = SPOT_TYPES[type as SpotType];
          const TypeIcon = typeInfo.icon;

          return (
            <div key={type} className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
              <button
                onClick={() => toggleType(type)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    typeInfo.color === 'green' ? 'bg-green-500/20 text-green-400' :
                      typeInfo.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                    }`}>
                    <TypeIcon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-white">{typeInfo.label}</h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span className="text-green-400">{stats.free} livres</span>
                      <span>•</span>
                      <span className="text-red-400">{stats.occupied} ocupadas</span>
                      {stats.reserved > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-400">{stats.reserved} reservadas</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${Number(occupancyRate) > 80 ? 'bg-red-500' :
                          Number(occupancyRate) > 50 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-400 w-10">{occupancyRate}%</span>
                  </div>

                  {isExpanded ?
                    <ChevronUp className="w-5 h-5 text-gray-400" /> :
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="p-3 bg-black/40 rounded-lg">
                    <div className="grid grid-cols-10 gap-1.5">
                      {stats.spots.map((spot) => {
                        const Icon = SPOT_TYPES[spot.type].icon;
                        const status = SPOT_STATUS[spot.status];
                        const typeColor = SPOT_TYPES[spot.type].color;

                        return (
                          <button
                            key={spot.id}
                            onClick={() => onSpotClick(spot)}
                            className={`relative aspect-square rounded-xl ${status.bgColor} ${status.glowColor} 
                border-2 ${status.borderColor} transition-all duration-300 
                hover:scale-110 hover:shadow-2xl hover:z-10 group overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <div className={`absolute inset-0 rounded-xl ring-2 ring-offset-2 ring-offset-slate-900 opacity-60
                ${typeColor === 'blue' ? 'ring-blue-400' : ''}
                ${typeColor === 'green' ? 'ring-green-400' : ''}
                ${typeColor === 'orange' ? 'ring-orange-400' : ''}
                ${typeColor === 'purple' ? 'ring-purple-400' : ''}
              `}></div>

                            <div className="relative h-full flex flex-col items-center justify-center p-2">
                              <Icon className="w-5 h-5 text-white mb-1 drop-shadow-lg" strokeWidth={2.5} />
                              <div className="bg-slate-900/50 rounded-md p-1">
                                <div className="text-[11px] font-semibold text-white drop-shadow-lg ">
                                  {spot.number}
                                </div>
                              </div>
                            </div>

                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-20 shadow-xl border border-slate-700">
                              <div className="font-bold mb-1">{spot.number}</div>
                              <div className="text-slate-300">Setor {1}</div>
                              <div className={`${spot.status === 'FREE' ? 'text-emerald-400' :
                                spot.status === 'OCCUPIED' ? 'text-red-400' :
                                  spot.status === 'RESERVED' ? 'text-amber-400' :
                                    'text-gray-400'
                                }`}>
                                {status.label}
                              </div>
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45"></div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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