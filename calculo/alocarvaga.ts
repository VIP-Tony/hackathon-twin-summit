import { prisma } from '@/lib/prisma';
import { SpotStatus, SpotType } from '@/lib/generated/prisma/enums';
import { escolherEst } from './escolheest';
import type { SetorTrabalho } from './logicaest';

export async function alocarVaga(params: {
	userId: string;
	parkingLot1Id: string;
	parkingLot2Id: string;
	setor_trabalho: SetorTrabalho;
	situacao: boolean;
}) {
	const { userId, parkingLot1Id, parkingLot2Id, setor_trabalho, situacao } =
		params;

	const resultado = await escolherEst({
		userId,
		parkingLot1Id,
		parkingLot2Id,
		setor_trabalho,
		situacao,
	});

	if (!resultado) {
		return { sucesso: false, motivo: 'Sem vaga disponível' };
	}

	const { estacionamento, tipoVaga } = resultado;

	const chosenParkingLotId =
		estacionamento === 1 ? parkingLot1Id : parkingLot2Id;

	let dataUpdate: any = {};
	if (tipoVaga === SpotType.GENERAL) {
		dataUpdate = { totalGeneralSpotsCharger: { increment: 1 } };
	} else if (tipoVaga === SpotType.PCD) {
		dataUpdate = { totalPCDSpotsCharger: { increment: 1 } };
	} else if (tipoVaga === SpotType.ELECTRIC) {
		dataUpdate = { totalElectricSpotsCharger: { increment: 1 } };
	} else if (tipoVaga === SpotType.MOTORCYCLE) {
		dataUpdate = { totalMotorcycleSpotsCharger: { increment: 1 } };
	}

	const spot = await prisma.parkingSpot.findFirst({
		where: {
			parkingLotId: chosenParkingLotId,
			type: tipoVaga,
			status: SpotStatus.FREE,
		},
	});

	if (!spot) {
		const lotAtualizado = await prisma.parkingLot.update({
			where: { id: chosenParkingLotId },
			data: dataUpdate,
		});

		return {
			sucesso: true,
			estacionamento,
			parkingLotId: chosenParkingLotId,
			tipoVaga,
			spotId: null,
			lotAtualizado,
			aviso:
				'Contador atualizado, mas nenhuma vaga física FREE encontrada desse tipo.',
		};
	}

	const [lotAtualizado, spotAtualizado] = await prisma.$transaction([
		prisma.parkingLot.update({
			where: { id: chosenParkingLotId },
			data: dataUpdate,
		}),
		prisma.parkingSpot.update({
			where: { id: spot.id },
			data: { status: SpotStatus.OCCUPIED },
		}),
	]);

	return {
		sucesso: true,
		estacionamento,
		parkingLotId: chosenParkingLotId,
		tipoVaga,
		spotId: spotAtualizado.id,
		lotAtualizado,
	};
}