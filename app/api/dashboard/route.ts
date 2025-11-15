import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const last24Hours = new Date();
        last24Hours.setHours(last24Hours.getHours() - 24);

        // Executar queries em paralelo usando Promise.all
        const [spots, recentEvents, eventsLast24] = await Promise.all([
            // Query 1: Buscar vagas com apenas os campos necessários
            prisma.parkingSpot.findMany({
                select: {
                    id: true,
                    number: true,
                    type: true,
                    status: true,
                    hasCharger: true,
                    section: true,
                    parkingLotId: true,
                    updatedAt: true,
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
            }),

            // Query 2: Eventos recentes com apenas campos necessários
            prisma.ioTEvent.findMany({
                take: 15,
                orderBy: {
                    timestamp: 'desc'
                },
                select: {
                    id: true,
                    type: true,
                    data: true,
                    timestamp: true,
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
            }).catch(() => []),

            // Query 3: Eventos das últimas 24h com apenas campos para agregação
            prisma.ioTEvent.findMany({
                where: {
                    timestamp: {
                        gte: last24Hours
                    },
                    type: {
                        in: ['ARRIVAL', 'RESERVATION'] // Filtrar apenas tipos relevantes
                    }
                },
                select: {
                    type: true,
                    timestamp: true,
                    data: true
                },
                orderBy: {
                    timestamp: 'asc'
                }
            }).catch(() => [])
        ]);

        // Processar estatísticas de forma eficiente com um único loop
        const stats = {
            total: spots.length,
            occupied: 0,
            free: 0,
            reserved: 0,
            byType: {
                GENERAL: 0,
                PCD: 0,
                ELECTRIC: 0,
                MOTORCYCLE: 0
            }
        };

        const formattedSpots = spots.map(spot => {
            // Calcular stats durante o mesmo loop de formatação
            if (spot.status === 'OCCUPIED') stats.occupied++;
            else if (spot.status === 'FREE') stats.free++;
            else if (spot.status === 'RESERVED') stats.reserved++;
            
            stats.byType[spot.type as keyof typeof stats.byType]++;

            return {
                id: spot.id,
                number: spot.number,
                type: spot.type,
                parkingLot: spot.parkingLot.name,
                parkingLotId: spot.parkingLotId,
                sector: spot.section || 'A',
                status: spot.status,
                hasCharger: spot.hasCharger,
                lastUpdate: spot.updatedAt.toISOString()
            };
        });

        // Processar dados horários de forma otimizada
        const hourlyCounts = new Array(24).fill(null).map(() => ({
            ocupacao: 0,
            reservas: 0
        }));

        for (const ev of eventsLast24) {
            const data = ev.data as { horario?: string } | undefined;
            let eventDate = new Date(ev.timestamp);

            if (data?.horario) {
                const [hStr, mStr] = data.horario.split(":");
                eventDate.setHours(Number(hStr), Number(mStr), 0, 0);
            }

            const hour = eventDate.getHours();

            if (ev.type === 'ARRIVAL') {
                hourlyCounts[hour].ocupacao++;
            } else if (ev.type === 'RESERVATION') {
                hourlyCounts[hour].reservas++;
            }
        }

        const hourlyData = hourlyCounts.map((c, i) => ({
            hour: `${i}:00`,
            ocupacao: c.ocupacao,
            reservas: c.reservas
        }));

        // Formatar eventos de forma otimizada
        const formattedEvents = recentEvents.map(event => {
            const data = event.data as { 
                horario?: string; 
                veiculo?: string; 
                nome?: string; 
                placa?: string; 
                engarrafamento?: boolean; 
                estacionamento?: string 
            } | undefined;

            let timestamp: string | null = null;

            if (data?.horario) {
                const [hStr, mStr] = data.horario.split(':');
                const baseDate = new Date(event.timestamp);
                baseDate.setHours(Number(hStr), Number(mStr), 0, 0);
                timestamp = baseDate.toISOString();
            }

            return {
                id: event.id,
                name: data?.nome ?? 'N/A',
                spotNumber: event.spot?.number ?? 'N/A',
                action: event.type,
                charger: data?.engarrafamento ?? false,
                parking: data?.estacionamento ?? 'N/A',
                vehicle: data?.placa ?? data?.veiculo ?? 'N/A',
                timestamp
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

        return NextResponse.json(
            {
                error: 'Failed to fetch dashboard data',
                details: error instanceof Error ? error.message : 'Unknown error',
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