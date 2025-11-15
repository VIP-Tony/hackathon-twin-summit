import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SpotType } from '@/lib/generated/prisma/enums';
import { alocarVaga } from '@/calculo/alocarvaga';
import type { SetorTrabalho, TipoCarro } from '@/calculo/logicaest';

const TOTAL_VEICULOS = 175;

const PCT_SETOR_1 = 0.6;
const PCT_SETOR_2 = 0.25;
const QTD_SETOR_1 = Math.round(PCT_SETOR_1 * TOTAL_VEICULOS);
const QTD_SETOR_2 = Math.round(PCT_SETOR_2 * TOTAL_VEICULOS);
const QTD_DISTANTES = TOTAL_VEICULOS - QTD_SETOR_1 - QTD_SETOR_2;

const QTD_MOTO = 18;
const QTD_ELETRICO = 10;
const QTD_PCD = 12;
const QTD_GENERAL = TOTAL_VEICULOS - QTD_MOTO - QTD_ELETRICO - QTD_PCD;

const START_MIN = 7 * 60 + 30;
const END_MIN = 9 * 60;

const CONG_INICIO = 8 * 60;
const CONG_FIM = 8 * 60 + 17;

const USER_ID = 'cmhzuzg0z0007u400fscu1cci';
const PARKING_LOT_1_ID = 'cmhzuzfko0002u400hs9jrg3s';
const PARKING_LOT_2_ID = 'cmhzuzfwn0005u400o4w5x3n7';

function randomInt(minInclusive: number, maxInclusive: number) {
	return (
		Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) +
		minInclusive
	);
}

function gerarHorarioAleatorio(): number {
	return randomInt(START_MIN, END_MIN);
}

function isCongestionado(mins: number): boolean {
	return mins >= CONG_INICIO && mins <= CONG_FIM;
}

function formatTime(mins: number): string {
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return `${h.toString().padStart(2, '0')}:${m
		.toString()
		.padStart(2, '0')}`;
}

function mapTipoCarroToSpotType(tipo: TipoCarro): SpotType {
	if (tipo === 'PCD') return SpotType.PCD;
	if (tipo === 'ELECTRIC') return SpotType.ELECTRIC;
	if (tipo === 'MOTORCYCLE') return SpotType.MOTORCYCLE;
	return SpotType.GENERAL;
}

type VeiculoSim = {
	id: number;
	tipo_carro: TipoCarro;
	setor_trabalho: SetorTrabalho;
	arrivalMinutes: number;
};

function gerarVeiculos(): VeiculoSim[] {
	const veiculos: VeiculoSim[] = [];

	// tipos
	const tipos: TipoCarro[] = [];
	for (let i = 0; i < QTD_MOTO; i++) tipos.push('MOTORCYCLE');
	for (let i = 0; i < QTD_ELETRICO; i++) tipos.push('ELECTRIC');
	for (let i = 0; i < QTD_PCD; i++) tipos.push('PCD');
	for (let i = 0; i < QTD_GENERAL; i++) tipos.push('GENERAL');

	// embaralha tipos
	for (let i = tipos.length - 1; i > 0; i--) {
		const j = randomInt(0, i);
		[tipos[i], tipos[j]] = [tipos[j], tipos[i]];
	}

	// setores
	const setores: SetorTrabalho[] = [];
	for (let i = 0; i < QTD_SETOR_1; i++) setores.push('esquerda');
	for (let i = 0; i < QTD_SETOR_2; i++) setores.push('direita');
	for (let i = 0; i < QTD_DISTANTES; i++) {
		setores.push(Math.random() < 0.5 ? 'esquerda' : 'direita');
	}

	// embaralha setores
	for (let i = setores.length - 1; i > 0; i--) {
		const j = randomInt(0, i);
		[setores[i], setores[j]] = [setores[j], setores[i]];
	}

	// monta veículos com horário
	for (let i = 0; i < TOTAL_VEICULOS; i++) {
		veiculos.push({
			id: i + 1,
			tipo_carro: tipos[i],
			setor_trabalho: setores[i],
			arrivalMinutes: gerarHorarioAleatorio(),
		});
	}

	// ordena por hora de chegada
	veiculos.sort((a, b) => a.arrivalMinutes - b.arrivalMinutes);

	return veiculos;
}

export async function GET() {
	const veiculos = gerarVeiculos();

	let enviadosEst1 = 0;
	let enviadosEst2 = 0;
	let semVaga = 0;

	const porTipoEst1: Record<string, number> = {};
	const porTipoEst2: Record<string, number> = {};

	const logs: any[] = [];

	for (const v of veiculos) {
		const horaStr = formatTime(v.arrivalMinutes);
		const congestionado = isCongestionado(v.arrivalMinutes);

		// atualiza tipo de veículo do usuário
		const novoTipo = mapTipoCarroToSpotType(v.tipo_carro);
		await prisma.user.update({
			where: { id: USER_ID },
			data: { vehicleType: novoTipo },
		});

		// usa a lógica real pra alocar
		const resultado = await alocarVaga({
			userId: USER_ID,
			parkingLot1Id: PARKING_LOT_1_ID,
			parkingLot2Id: PARKING_LOT_2_ID,
			setor_trabalho: v.setor_trabalho,
			situacao: congestionado,
		});

		if (!resultado.sucesso) {
			semVaga++;
			logs.push({
				hora: horaStr,
				veiculoId: v.id,
				tipo_carro: v.tipo_carro,
				setor_trabalho: v.setor_trabalho,
				congestionado,
				status: 'SEM_VAGA',
			});
			continue;
		}

		// aqui o TS acha que tipoVaga pode ser undefined, então forçamos que não é
		const { estacionamento, parkingLotId, spotId } = resultado;
		const tipoVaga = resultado.tipoVaga as SpotType; // confia, sempre vem quando sucesso = true
		const key = String(tipoVaga);

		if (estacionamento === 1) {
			enviadosEst1++;
			porTipoEst1[key] = (porTipoEst1[key] ?? 0) + 1;
		} else {
			enviadosEst2++;
			porTipoEst2[key] = (porTipoEst2[key] ?? 0) + 1;
		}

		logs.push({
			hora: horaStr,
			veiculoId: v.id,
			tipo_carro: v.tipo_carro,
			setor_trabalho: v.setor_trabalho,
			congestionado,
			status: 'ALOCADO',
			estacionamento,
			tipoVaga,
			parkingLotId,
			spotId,
		});
	}

	const resumo = {
		totalVeiculos: TOTAL_VEICULOS,
		setorTrabalho: {
			aproxSetor1: QTD_SETOR_1,
			aproxSetor2: QTD_SETOR_2,
			aproxDistantes: QTD_DISTANTES,
		},
		tiposVeiculo: {
			moto: QTD_MOTO,
			eletrico: QTD_ELETRICO,
			pcd: QTD_PCD,
			geral: QTD_GENERAL,
		},
		resultado: {
			enviadosEst1,
			enviadosEst2,
			semVaga,
			porTipoEst1,
			porTipoEst2,
		},
	};

	console.log('RESUMO SIMULAÇÃO MANHÃ:', resumo);

	return NextResponse.json({
		resumo,
		logs,
	});
}
