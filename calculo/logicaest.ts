import { SpotType } from '@/lib/generated/prisma/enums';

export type SetorTrabalho = 'esquerda' | 'direita';

export type TipoCarro = 'PCD' | 'ELECTRIC' | 'MOTORCYCLE' | 'GENERAL';



export function mapearTipo(spotType: SpotType): TipoCarro {
	switch (spotType) {
		case 'PCD':
			return 'PCD';
		case 'ELECTRIC':
			return 'ELECTRIC';
		case 'MOTORCYCLE':
			return 'MOTORCYCLE';
		case 'GENERAL':
		default:
			return 'GENERAL';
	}
}

export type VagasInfo = {
	vagasLivres: number;
	pcdLivre: number;
	eletricoLivre: number;
	motoLivre: number;
};

export function vagaEspecial(estacionamento: VagasInfo, tipo: TipoCarro) {
	if (tipo === 'PCD') {
		return estacionamento.pcdLivre > 0;
	} else if (tipo === 'ELECTRIC') {
		return estacionamento.eletricoLivre > 0;
	}
	return false;
}

export function engarrafamento(situacao: boolean, vagas_dir: VagasInfo) {
	return situacao && vagas_dir.vagasLivres > 0;
}

export function acharVagaPcd(
	setor_trabalho: SetorTrabalho,
	vagas_esq: VagasInfo,
	vagas_dir: VagasInfo,
	situacao: boolean
): 'esquerda' | 'direita' | null {
	if (engarrafamento(situacao, vagas_dir)) return 'direita';

	if (setor_trabalho === 'esquerda' && vagaEspecial(vagas_esq, 'PCD'))
		return 'esquerda';
	if (setor_trabalho === 'direita' && vagaEspecial(vagas_dir, 'PCD'))
		return 'direita';

	if (setor_trabalho === 'esquerda' && vagas_esq.vagasLivres > 0)
		return 'esquerda';
	if (setor_trabalho === 'direita' && vagas_dir.vagasLivres > 0)
		return 'direita';

	if (setor_trabalho === 'esquerda' && vagaEspecial(vagas_dir, 'PCD'))
		return 'direita';
	if (setor_trabalho === 'direita' && vagaEspecial(vagas_esq, 'PCD'))
		return 'esquerda';

	if (setor_trabalho === 'esquerda' && vagas_dir.vagasLivres > 0)
		return 'direita';
	if (setor_trabalho === 'direita' && vagas_esq.vagasLivres > 0)
		return 'esquerda';

	return null;
}

export function acharVagaEletrico(
	setor_trabalho: SetorTrabalho,
	vagas_esq: VagasInfo,
	vagas_dir: VagasInfo,
	situacao: boolean
): 'esquerda' | 'direita' | null {
	if (engarrafamento(situacao, vagas_esq)) return 'esquerda';

	if (setor_trabalho === 'esquerda' && vagaEspecial(vagas_esq, 'ELECTRIC'))
		return 'esquerda';
	if (setor_trabalho === 'direita' && vagaEspecial(vagas_dir, 'ELECTRIC'))
		return 'direita';

	if (setor_trabalho === 'esquerda' && vagaEspecial(vagas_dir, 'ELECTRIC'))
		return 'direita';
	if (setor_trabalho === 'direita' && vagaEspecial(vagas_esq, 'ELECTRIC'))
		return 'esquerda';

	if (setor_trabalho === 'esquerda' && vagas_esq.vagasLivres > 0)
		return 'esquerda';
	if (setor_trabalho === 'direita' && vagas_dir.vagasLivres > 0)
		return 'direita';

	if (setor_trabalho === 'esquerda' && vagas_dir.vagasLivres > 0)
		return 'direita';
	if (setor_trabalho === 'direita' && vagas_esq.vagasLivres > 0)
		return 'esquerda';

	return null;
}

export function acharVagaNormalEMoto(
	setor_trabalho: SetorTrabalho,
	vagas_esq: VagasInfo,
	vagas_dir: VagasInfo,
	situacao: boolean,
	tipo_vaga: 'vagasLivres' | 'motoLivre'
): 'esquerda' | 'direita' | null {
	if (engarrafamento(situacao, vagas_esq)) return 'esquerda';

	if (
		setor_trabalho === 'esquerda' &&
		vagas_esq[tipo_vaga] &&
		vagas_esq[tipo_vaga] > 0
	)
		return 'esquerda';

	if (
		setor_trabalho === 'direita' &&
		vagas_dir[tipo_vaga] &&
		vagas_dir[tipo_vaga] > 0
	)
		return 'direita';

	if (
		setor_trabalho === 'esquerda' &&
		vagas_dir[tipo_vaga] &&
		vagas_dir[tipo_vaga] > 0
	)
		return 'direita';

	if (
		setor_trabalho === 'direita' &&
		vagas_esq[tipo_vaga] &&
		vagas_esq[tipo_vaga] > 0
	)
		return 'esquerda';

	return null;
}

export function acharVaga(
	tipo_carro: TipoCarro,
	setor_trabalho: SetorTrabalho,
	situacao: boolean,
	vagas_esq: VagasInfo,
	vagas_dir: VagasInfo
): 'esquerda' | 'direita' | null {
	if (tipo_carro === 'PCD')
		return acharVagaPcd(setor_trabalho, vagas_esq, vagas_dir, situacao);

	if (tipo_carro === 'ELECTRIC')
		return acharVagaEletrico(setor_trabalho, vagas_esq, vagas_dir, situacao);

	if (tipo_carro === 'MOTORCYCLE')
		return acharVagaNormalEMoto(
			setor_trabalho,
			vagas_esq,
			vagas_dir,
			situacao,
			'motoLivre'
		);

	return acharVagaNormalEMoto(
		setor_trabalho,
		vagas_esq,
		vagas_dir,
		situacao,
		'vagasLivres'
	);
}

export type Resultado = {
	estacionamento: 1 | 2;
	tipoVaga: SpotType;
}

export function retornarVaga(
	tipo_carro: TipoCarro,
	setor_trabalho: SetorTrabalho,
	situacao: boolean,
	vagas1: VagasInfo, 
	vagas2: VagasInfo 
): Resultado | null {
	const lado = acharVaga(tipo_carro, setor_trabalho, situacao, vagas1, vagas2);
	if (!lado) return null;

	const estacionamento = lado === 'esquerda' ? 1 : 2;
	const vagasEscolhido = lado === 'esquerda' ? vagas1 : vagas2;

	let tipoVaga: SpotType | null = null;

	if (tipo_carro === 'PCD') {
		if (vagasEscolhido.pcdLivre > 0) tipoVaga = SpotType.PCD;
		else if (vagasEscolhido.vagasLivres > 0) tipoVaga = SpotType.GENERAL;
	} else if (tipo_carro === 'ELECTRIC') {
		if (vagasEscolhido.eletricoLivre > 0) tipoVaga = SpotType.ELECTRIC;
		else if (vagasEscolhido.vagasLivres > 0) tipoVaga = SpotType.GENERAL;
	} else if (tipo_carro === 'MOTORCYCLE') {
		if (vagasEscolhido.motoLivre > 0) tipoVaga = SpotType.MOTORCYCLE;
	} else {
		if (vagasEscolhido.vagasLivres > 0) tipoVaga = SpotType.GENERAL;
	}

	if (!tipoVaga) return null;

	return { estacionamento, tipoVaga };
}