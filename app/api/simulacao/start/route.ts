import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gerarVeiculos } from "../util/geradorveiculos";
import { SimulacaoJob } from "../gerencia";

export async function POST() {
    if (SimulacaoJob.status === "running") {
        return NextResponse.json({
            message: "Já existe uma simulação rodando."
        });
    }

    const usuarios = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        take: 175
    });

    const parkingLots = await prisma.parkingLot.findMany({
        orderBy: { createdAt: "asc" },
        take: 2,
    });

    const parkingLot1Id = parkingLots[0].id;
    const parkingLot2Id = parkingLots[1].id;

    const veiculos = gerarVeiculos();

    for (let i = 0; i < veiculos.length; i++) {
        veiculos[i].userId = usuarios[i].id;
    }

        for (let i = 0; i < veiculos.length; i++) {
        veiculos[i].userId = usuarios[i].id;
        veiculos[i].parkingLot1Id = parkingLot1Id;
        veiculos[i].parkingLot2Id = parkingLot2Id;
    }

    SimulacaoJob.start(veiculos);

    return NextResponse.json({
        message: "Simulação iniciada com sucesso.",
        total: veiculos.length
    });
}