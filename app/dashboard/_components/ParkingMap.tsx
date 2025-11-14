import { SPOT_STATUS, SPOT_TYPES } from "@/components/SpotsStatusAndTypes";
import { ParkingSpot } from "@/lib/generated/prisma/client";
import { SpotType } from "@/lib/generated/prisma/enums";
import { Accessibility, ChevronDown, ChevronUp, MapPin, Zap } from "lucide-react";
import { useMemo, useState } from "react";

type SectorStats = {
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
  selectedLot: number;
};

export const ParkingMap = ({ spots, selectedType, onSpotClick, selectedLot }: ParkingMapProps) => {
  const [expandedSectors, setExpandedSectors] = useState(new Set(['A', 'B']));
  const [currentLot, setCurrentLot] = useState(selectedLot);

  const filteredSpots = useMemo(() => {
    let filtered = spots.filter(s => s.parkingLot === currentLot);
    if (selectedType) {
      filtered = filtered.filter(s => s.type === selectedType);
    }
    return filtered;
  }, [spots, selectedType, currentLot]);

  const sectorStats = useMemo(() => {
    const sectors: any = {};
    filteredSpots.forEach(spot => {
      if (!sectors[spot.sector]) {
        sectors[spot.sector] = {
          total: 0,
          free: 0,
          occupied: 0,
          reserved: 0,
          spots: []
        };
      }
      sectors[spot.sector].total++;
      sectors[spot.sector].spots.push(spot);
      if (spot.status === 'FREE') sectors[spot.sector].free++;
      if (spot.status === 'OCCUPIED') sectors[spot.sector].occupied++;
      if (spot.status === 'RESERVED') sectors[spot.sector].reserved++;
    });
    return sectors;
  }, [filteredSpots]);

  const toggleSector = (sector: string) => {
    const newExpanded = new Set(expandedSectors);
    if (newExpanded.has(sector)) {
      newExpanded.delete(sector);
    } else {
      newExpanded.add(sector);
    }
    setExpandedSectors(newExpanded);
  };

  const getSectorLabel = (sector: string) => {
    const firstSpot = filteredSpots.find(s => s.sector === sector);
    if (!firstSpot) return sector;

    if (sector === 'A') return 'Vagas Especiais';
    if (firstSpot.type === 'MOTORCYCLE') return 'Motocicletas';
    return `Setor ${sector}`;
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
                E{lot} ({occupancyRate}%)
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(sectorStats as Record<string, SectorStats>)
          .sort()
          .map(([sector, stats]) => {
            const isExpanded = expandedSectors.has(sector);
            const occupancyRate = ((stats.occupied / stats.total) * 100).toFixed(0);

            return (
              <div key={sector} className="bg-gray-800/60 rounded-lg border border-gray-700 overflow-hidden">
                <button
                  onClick={() => toggleSector(sector)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                      {sector}
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white">{getSectorLabel(sector)}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span className="text-green-400">{stats.free} livres</span>
                        <span>•</span>
                        <span className="text-red-400">{stats.occupied} ocupadas</span>
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

                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="p-3 bg-black/40 rounded-lg">
                      <div className="grid grid-cols-10 gap-1.5">
                        {stats.spots.map((spot) => {
                          const Icon = SPOT_TYPES[spot.type].icon;
                          return (
                            <button
                              key={spot.id}
                              onClick={() => onSpotClick(spot)}
                              className={`aspect-square rounded flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-lg ${SPOT_STATUS[spot.status].bgColor} ${spot.type === 'PCD' ? 'ring-1 ring-blue-400' : ''
                                } ${spot.type === 'ELECTRIC' ? 'ring-1 ring-green-400' : ''} ${spot.type === 'MOTORCYCLE' ? 'ring-1 ring-orange-400' : ''
                                } relative group`}
                              title={`${spot.number} - ${SPOT_TYPES[spot.type].label} - ${SPOT_STATUS[spot.status].label}`}
                            >
                              <Icon className="w-3 h-3" />
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                {spot.number}
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
