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

    const veiculos = gerarVeiculos();

    for (let i = 0; i < veiculos.length; i++) {
        veiculos[i].userId = usuarios[i].id;
    }

    SimulacaoJob.start(veiculos);

    return NextResponse.json({
        message: "Simulação iniciada com sucesso.",
        total: veiculos.length
    });
}