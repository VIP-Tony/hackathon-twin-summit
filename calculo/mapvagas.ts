import type { ParkingLot } from '@/lib/generated/prisma/client'; 
import type { VagasInfo } from './logicaest'; 

export function mapearVagas(lot: ParkingLot): VagasInfo {
    return {
        vagasLivres: lot.totalGeneralSpots - lot.totalGeneralSpotsCharger,
        pcdLivre: lot.totalPCDSpots - lot.totalPCDSpotsCharger,
        eletricoLivre: lot.totalElectricSpots - lot.totalElectricSpotsCharger,
        motoLivre:
            lot.totalMotorcycleSpots - lot.totalMotorcycleSpotsCharger,
    };
}