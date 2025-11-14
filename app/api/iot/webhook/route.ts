import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, spotNumber, eventType, vehiclePlate, data } = body;

    // Buscar dispositivo
    const device = await prisma.ioTDevice.findUnique({
      where: { deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      );
    }

    // Buscar vaga
    const spot = await prisma.parkingSpot.findFirst({
      where: {
        number: spotNumber,
        parkingLotId: device.parkingLotId,
      },
    });

    if (!spot) {
      return NextResponse.json(
        { error: 'Spot not found' },
        { status: 404 }
      );
    }

    // Criar evento
    const event = await prisma.ioTEvent.create({
      data: {
        type: eventType,
        vehiclePlate,
        data: data || {},
        deviceId: device.id,
        spotId: spot.id,
      },
    });

    // Atualizar status da vaga
    const newStatus = eventType === 'ARRIVAL' ? 'OCCUPIED' : 'FREE';
    await prisma.parkingSpot.update({
      where: { id: spot.id },
      data: { status: newStatus },
    });

    // Se for saída, fechar log de ocupação
    if (eventType === 'DEPARTURE') {
      const openLog = await prisma.occupancyLog.findFirst({
        where: {
          spotId: spot.id,
          exitTime: null,
        },
      });

      if (openLog) {
        const duration = Math.floor(
          (Date.now() - openLog.entryTime.getTime()) / 60000
        );
        await prisma.occupancyLog.update({
          where: { id: openLog.id },
          data: {
            exitTime: new Date(),
            duration,
          },
        });
      }
    } else if (eventType === 'ARRIVAL') {
      // Criar novo log de ocupação
      await prisma.occupancyLog.create({
        data: {
          spotId: spot.id,
          vehiclePlate,
        },
      });
    }

    return NextResponse.json({
      success: true,
      event,
      spot: { id: spot.id, number: spot.number, status: newStatus },
    });
  } catch (error) {
    console.error('IoT Webhook Error:', error);
    return NextResponse.json(
      { error: 'Failed to process IoT event' },
      { status: 500 }
    );
  }
}