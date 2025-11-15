import { prisma } from "@/lib/prisma";
import { alocarVaga } from "@/calculo/alocarvaga";

type JobStatus = "idle" | "running" | "finished";

export const SimulacaoJob = {
    status: "idle" as JobStatus,
    total: 0,
    atual: 0,
    logs: [] as any[],
    startedAt: null as Date | null,
    finishedAt: null as Date | null,

    async start(veiculos: any[]) {
        if (this.status === "running") return;

        this.status = "running";
        this.startedAt = new Date();
        this.finishedAt = null;
        this.logs = [];
        this.total = veiculos.length;
        this.atual = 0;

        console.log("SIMULAÇÃO INICIADA");

        for (const v of veiculos) {
            if (this.status !== "running") break;

            await new Promise((res) => setTimeout(res, 80));

            const congestionado =
                v.arrivalMinutes >= 480 && v.arrivalMinutes <= 497;

            const resultado = await alocarVaga({
                userId: v.userId,
                parkingLot1Id: v.pl1,
                parkingLot2Id: v.pl2,
                setor_trabalho: v.setor_trabalho,
                situacao: congestionado,
            });

            if (!resultado.sucesso) {
                this.logs.push({
                    id: v.id,
                    tipo: v.tipo_carro,
                    hora: v.arrivalTimeStr,
                    status: "SEM_VAGA",
                });
                this.atual++;
                continue;
            }

            await prisma.ioTEvent.create({
                data: {
                    type: "ARRIVAL",
                    spotId: resultado.spotId!,
                    deviceId: "simulated-device",
                    data: {
                        veiculo: v.tipo_carro,
                        horario: v.arrivalTimeStr,
                    },
                },
            });

            this.logs.push({
                id: v.id,
                tipo: v.tipo_carro,
                hora: v.arrivalTimeStr,
                status: "OK",
                estacionamento: resultado.estacionamento,
                tipoVaga: resultado.tipoVaga,
            });

            this.atual++;
        }

        this.finishedAt = new Date();
        this.status = "finished";
        console.log("SIMULAÇÃO FINALIZADA");
    },
};