import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      totalSpots,
      occupiedSpots,
      freeSpots,
      reservedSpots,
      spotsByType,
      recentEvents,
    ] = await Promise.all([
      prisma.parkingSpot.count(),
      prisma.parkingSpot.count({ where: { status: 'OCCUPIED' } }),
      prisma.parkingSpot.count({ where: { status: 'FREE' } }),
      prisma.parkingSpot.count({ where: { status: 'RESERVED' } }),
      prisma.parkingSpot.groupBy({
        by: ['type'],
        _count: true,
      }),
      prisma.ioTEvent.findMany({
        take: 20,
        orderBy: { timestamp: 'desc' },
        include: {
          device: true,
          spot: true,
        },
      }),
    ]);

    const occupancyRate = ((occupiedSpots / totalSpots) * 100).toFixed(1);

    return NextResponse.json({
      totalSpots,
      occupiedSpots,
      freeSpots,
      reservedSpots,
      occupancyRate,
      spotsByType,
      recentEvents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}