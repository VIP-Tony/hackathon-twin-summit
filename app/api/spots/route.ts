import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  try {
    const spots = await prisma.parkingSpot.findMany({
      where: {
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
      },
      include: {
        parkingLot: true,
        _count: {
          select: { occupancyLogs: true },
        },
      },
      orderBy: { number: 'asc' },
    });

    return NextResponse.json(spots);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch spots' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { spotId, status } = body;

  try {
    const spot = await prisma.parkingSpot.update({
      where: { id: spotId },
      data: { status, updatedAt: new Date() },
    });

    return NextResponse.json(spot);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update spot' },
      { status: 500 }
    );
  }
}