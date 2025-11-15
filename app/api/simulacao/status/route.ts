import { NextResponse } from "next/server";
import { SimulacaoJob } from "../gerencia";

export async function GET() {
    return NextResponse.json({
        status: SimulacaoJob.status,
        total: SimulacaoJob.total,
        atual: SimulacaoJob.atual,
        progresso: SimulacaoJob.total
            ? (SimulacaoJob.atual / SimulacaoJob.total) * 100
            : 0,
        logs: SimulacaoJob.logs.slice(-20),
        startedAt: SimulacaoJob.startedAt,
        finishedAt: SimulacaoJob.finishedAt,
    });
}
