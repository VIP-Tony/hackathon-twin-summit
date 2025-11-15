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

    // Buscar dados de ocupação por hora (últimas 24 horas)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    let occupancyByHour: Array<{ hour: number; ocupacao: bigint; reservas: bigint }> = [];
    
    try {
      occupancyByHour = await prisma.$queryRaw`
        SELECT 
          EXTRACT(HOUR FROM timestamp) as hour,
          COUNT(*) FILTER (WHERE type = 'ARRIVAL') as ocupacao,
          COUNT(*) FILTER (WHERE type = 'RESERVATION') as reservas
        FROM "IoTEvent"
        WHERE timestamp >= ${last24Hours}
        GROUP BY EXTRACT(HOUR FROM timestamp)
        ORDER BY hour
      `;
    } catch (err) {
      console.error('Error fetching hourly data:', err);
      // Continuar com array vazio
    }

    // Formatar dados de ocupação por hora
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourData = occupancyByHour.find(h => Number(h.hour) === i);
      return {
        hour: `${i}:00`,
        ocupacao: hourData ? Number(hourData.ocupacao) : 0,
        reservas: hourData ? Number(hourData.reservas) : 0
      };
    });

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

    // Formatar eventos para o formato esperado pelo frontend
    const formattedEvents = recentEvents.map(event => ({
      id: event.id,
      deviceId: event.device.deviceId,
      spotNumber: event.spot?.number || 'N/A',
      action: event.type,
      vehicle: event.vehiclePlate || 'N/A',
      timestamp: event.timestamp.toISOString()
    }));

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