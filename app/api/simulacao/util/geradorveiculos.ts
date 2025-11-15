import { TipoCarro, SetorTrabalho } from "@/calculo/logicaest";

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

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function gerarVeiculos() {
    const tipos: TipoCarro[] = [];
    for (let i = 0; i < QTD_MOTO; i++) tipos.push("MOTORCYCLE");
    for (let i = 0; i < QTD_ELETRICO; i++) tipos.push("ELECTRIC");
    for (let i = 0; i < QTD_PCD; i++) tipos.push("PCD");
    for (let i = 0; i < QTD_GENERAL; i++) tipos.push("GENERAL");

    tipos.sort(() => Math.random() - Math.random());

    const setores: SetorTrabalho[] = [];
    for (let i = 0; i < QTD_SETOR_1; i++) setores.push("esquerda");
    for (let i = 0; i < QTD_SETOR_2; i++) setores.push("direita");
    for (let i = 0; i < QTD_DISTANTES; i++)
        setores.push(Math.random() < 0.5 ? "esquerda" : "direita");

    setores.sort(() => Math.random() - Math.random());

    const veiculos = [];

    for (let i = 0; i < TOTAL_VEICULOS; i++) {
        const arrival = randomInt(450, 540); // 7:30 → 9:00

        veiculos.push({
            id: i + 1,
            tipo_carro: tipos[i],
            setor_trabalho: setores[i],
            arrivalMinutes: arrival,
            arrivalTimeStr: formatTime(arrival),

            userId: '',
            pl1: "cmhzuzfko0002u400hs9jrg3s",
            pl2: "cmhzuzfwn0005u400o4w5x3n7",
        });
    }

    return veiculos;
}
