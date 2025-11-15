import { NextResponse } from 'next/server';
import { alocarVaga } from '@/calculo/alocarvaga'; 

export async function GET() {
	const userId = 'cmhzuzg0z0007u400fscu1cci';
	const parkingLot1Id = 'cmhzuzfko0002u400hs9jrg3s';
	const parkingLot2Id = 'cmhzuzfwn0005u400o4w5x3n7';

	const resultado = await alocarVaga({
		userId,
		parkingLot1Id,
		parkingLot2Id,
		setor_trabalho: 'esquerda',
		situacao: false,
	});

	console.log('resultado alocarVaga:', resultado);

	return NextResponse.json(resultado);
}
