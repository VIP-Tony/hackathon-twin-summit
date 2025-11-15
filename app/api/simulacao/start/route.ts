import { NextResponse } from "next/server";
import { gerarVeiculos } from "../util/geradorveiculos";
import { SimulacaoJob } from "../gerencia";

export async function POST() {
    if (SimulacaoJob.status === "running") {
        return NextResponse.json({ message: "Já existe uma simulação rodando." });
    }

    const veiculos = gerarVeiculos();

    SimulacaoJob.start(veiculos);

    return NextResponse.json({
        message: "Simulação iniciada.",
        total: veiculos.length,
    });
}
