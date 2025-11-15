import { prisma } from '@/lib/prisma';
import {
	mapearTipo,
	retornarVaga,
	type SetorTrabalho,
	type TipoCarro,
	type Resultado,
} from './logicaest';
import { mapearVagas } from './mapvagas';

export async function escolherEst(params: {
	userId: string;
	parkingLot1Id: string; 
	parkingLot2Id: string; 
	setor_trabalho: SetorTrabalho;
	situacao: boolean;
}): Promise<Resultado | null> {
	const { userId, parkingLot1Id, parkingLot2Id, setor_trabalho, situacao } =
		params;

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { vehicleType: true },
	});

	if (!user) return null;

	const tipo_carro: TipoCarro = mapearTipo(user.vehicleType);

	const lots = await prisma.parkingLot.findMany({
		where: { id: { in: [parkingLot1Id, parkingLot2Id] } },
	});

	const lot1 = lots.find((l) => l.id === parkingLot1Id);
	const lot2 = lots.find((l) => l.id === parkingLot2Id);

	if (!lot1 || !lot2) return null;

	const vagas1 = mapearVagas(lot1);
	const vagas2 = mapearVagas(lot2);

	return retornarVaga(tipo_carro, setor_trabalho, situacao, vagas1, vagas2);
}