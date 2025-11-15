import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Testar conexão do banco primeiro
        await prisma.$connect();
        console.log('Database connected successfully');

        // Buscar todas as vagas com informações do estacionamento
        const spots = await prisma.parkingSpot.findMany({
            include: {
                parkingLot: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: [
                { parkingLotId: 'asc' },
                { section: 'asc' },
                { number: 'asc' }
            ]
        });

        console.log(`Found ${spots.length} parking spots`);

        // Buscar eventos recentes (últimas 15 entradas)
        const recentEvents = await prisma.ioTEvent.findMany({
            take: 15,
            orderBy: {
                timestamp: 'desc'
            },
            include: {
                device: {
                    select: {
                        deviceId: true,
                        name: true
                    }
                },
                spot: {
                    select: {
                        number: true
                    }
                }
            }
        }).catch(err => {
            console.error('Error fetching IoTEvents:', err);
            return []; // Retornar array vazio se falhar
        });

        console.log(`Found ${recentEvents.length} recent events`);

        // Buscar dados de ocupação por hora (últimas 24 horas) usando somente Prisma
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);

        let eventsLast24: Array<{ type: string; timestamp: Date }> = [];
        try {
            // traga apenas os campos necessários para a agregação em JS
            eventsLast24 = await prisma.ioTEvent.findMany({
                where: {
                    timestamp: {
                        gte: last24Hours
                    }
                },
                select: {
                    type: true,
                    timestamp: true
                },
                orderBy: {
                    timestamp: 'asc'
                }
            });
        } catch (err) {
            console.error('Error fetching events for last 24 hours:', err);
            eventsLast24 = [];
        }

        // inicializar contadores por hora (0..23)
        const hourlyCounts = Array.from({ length: 24 }, () => ({
            ocupacao: 0,
            reservas: 0
        }));

        // contar eventos por hora
        for (const ev of eventsLast24) {
            const hour = new Date(ev.timestamp).getHours(); // 0..23 (usa timezone do servidor)
            if (ev.type === 'ARRIVAL') hourlyCounts[hour].ocupacao += 1;
            if (ev.type === 'RESERVATION') hourlyCounts[hour].reservas += 1;
        }

        // Formatar dados de ocupação por hora para o frontend
        const hourlyData = hourlyCounts.map((c, i) => ({
            hour: `${i}:00`,
            ocupacao: c.ocupacao,
            reservas: c.reservas
        }));

        // Calcular estatísticas
        const stats = {
            total: spots.length,
            occupied: spots.filter(s => s.status === 'OCCUPIED').length,
            free: spots.filter(s => s.status === 'FREE').length,
            reserved: spots.filter(s => s.status === 'RESERVED').length,
            byType: {
                GENERAL: spots.filter(s => s.type === 'GENERAL').length,
                PCD: spots.filter(s => s.type === 'PCD').length,
                ELECTRIC: spots.filter(s => s.type === 'ELECTRIC').length,
                MOTORCYCLE: spots.filter(s => s.type === 'MOTORCYCLE').length
            }
        };

        // Formatar spots para o formato esperado pelo frontend
        const formattedSpots = spots.map(spot => ({
            id: spot.id,
            number: spot.number,
            type: spot.type,
            parkingLot: spot.parkingLot.name,
            parkingLotId: spot.parkingLotId,
            sector: spot.section || 'A',
            status: spot.status,
            hasCharger: spot.hasCharger,
            lastUpdate: spot.updatedAt.toISOString()
        }));

        const formattedEvents = recentEvents.map(event => {
            const data = event.data as { horario?: string; veiculo?: string; name?: string, nome?: string, placa?: string } | undefined;
            const horario = data?.horario; // ex: "09:00"
            let timestamp: string | null = null;

            if (horario) {
                // parse "HH:mm"
                const [hStr, mStr] = horario.split(':');
                const hours = Number(hStr ?? 0);
                const minutes = Number(mStr ?? 0);

                // usa a data do evento (se existir) para respeitar dia/mês/ano, senão usa hoje
                const baseDate = event.timestamp ? new Date(event.timestamp) : new Date();
                baseDate.setHours(hours, minutes, 0, 0); // define hora/minuto/segundos/ms
                timestamp = baseDate.toISOString();
            }

            return {
                id: event.id,
                name: data?.nome ?? 'N/A',
                spotNumber: event.spot?.number ?? 'N/A',
                action: event.type,
                vehicle: data?.placa ?? data?.veiculo ?? 'N/A', // cobre "veiculo" do JSON
                timestamp // string ISO ou null se não houver horario
            };
        });


        return NextResponse.json({
            spots: formattedSpots,
            events: formattedEvents,
            hourlyData,
            stats
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);

        // Retornar mais detalhes do erro
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json(
            {
                error: 'Failed to fetch dashboard data',
                details: errorMessage,
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    } finally {
        if (process.env.NODE_ENV === 'production') {
            await prisma.$disconnect();
        }
    }
}
