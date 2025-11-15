// app/api/parking/allocate/route.ts
import { NextResponse } from 'next/server';
import { alocarVaga } from '@/calculo/alocarvaga'; 

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const {
			userId,
			parkingLot1Id,
			parkingLot2Id,
			setor_trabalho,
			situacao,
		} = body;

		const resultado = await alocarVaga({
			userId,
			parkingLot1Id,
			parkingLot2Id,
			setor_trabalho,
			situacao,
		});

		console.log('resultado alocarVaga:', resultado);

		return NextResponse.json(resultado);
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: 'Erro ao alocar vaga' },
			{ status: 500 },
		);
	}
}
