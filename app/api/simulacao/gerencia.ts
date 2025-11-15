import { prisma } from "@/lib/prisma";
import { alocarVaga } from "@/calculo/alocarvaga";
import { Prisma } from "@prisma/client";

export const SimulacaoJob = {
    status: "idle" as "idle" | "running" | "finished",
    total: 0,
    atual: 0,
    logs: [] as any[],
    startedAt: null as Date | null,
    finishedAt: null as Date | null,

    fila: [] as any[],
    processando: false,

    timer: null as ReturnType<typeof setInterval> | null,

    reset() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.status = "idle";
        this.total = 0;
        this.atual = 0;
        this.logs = [];
        this.startedAt = null;
        this.finishedAt = null;
        this.fila = [];
        this.processando = false;
    },

    async processarFila() {
        if (this.processando) return;
        this.processando = true;

        while (this.fila.length > 0) {
            const item = this.fila.shift();
            await item();
        }

        this.processando = false;
    },

    start(veiculos: any[]) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.fila = [];
        this.processando = false;

        this.status = "running";
        this.total = veiculos.length;
        this.atual = 0;
        this.startedAt = new Date();
        this.finishedAt = null;
        this.logs = [];

        const INTERVALO_REAL = 350; 

        let i = 0;
        this.timer = setInterval(() => {
            if (i >= veiculos.length) {
                if (this.timer) {
                    clearInterval(this.timer);
                    this.timer = null;
                }
                this.status = "finished";
                this.finishedAt = new Date();
                return;
            }

            const v = veiculos[i];
            i++;

            this.fila.push(async () => {
                try {
                    const congestionado =
                        v.arrivalMinutes >= (8 * 60) &&
                        v.arrivalMinutes <= (8 * 60 + 17);

                    const resultado = await alocarVaga({
                        userId: v.userId,
                        parkingLot1Id: v.parkingLot1Id,
                        parkingLot2Id: v.parkingLot2Id,
                        setor_trabalho: v.setor_trabalho,
                        tipo_carro: v.tipo_carro,
                        situacao: congestionado,
                    });

                    this.atual++;

                    await prisma.ioTEvent.create({
                    data: {
                        type: "ARRIVAL",
                        spotId: resultado.spotId,
                        data: {
                            veiculo: v.tipo_carro,
                            horario: v.arrivalTimeStr,
                            },
                        },
                    });

                    this.logs.push({
                        id: v.id,
                        hora: v.arrivalTimeStr,
                        congestionado,
                        resultado,
                    });

                } catch (err: any) {
                    console.error("Erro ao processar veículo:", err);
                    this.logs.push({
                        id: v.id,
                        erro: err.message,
                    });
                }
            });

            this.processarFila();
        }, INTERVALO_REAL);
    },
};