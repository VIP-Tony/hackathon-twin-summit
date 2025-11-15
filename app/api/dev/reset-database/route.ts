import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// Enums iguais aos do seu seed
const SpotStatus = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
};

type SpotStatusEnum = keyof typeof SpotStatus;

const SpotType = {
  GENERAL: 'GENERAL',
  PCD: 'PCD',
  ELECTRIC: 'ELECTRIC',
  MOTORCYCLE: 'MOTORCYCLE',
};

type SpotTypeEnum = keyof typeof SpotType;

const IoTEventType = {
  ARRIVAL: 'ARRIVAL',
  DEPARTURE: 'DEPARTURE',
};

type IoTEventTypeEnum = keyof typeof IoTEventType;

export async function GET() {
  try {
    console.log("🚨 Resetando o banco e recriando dados...");

    // 1️⃣ Apagar tudo na ordem segura
    await prisma.ioTEvent.deleteMany();
    await prisma.occupancyLog.deleteMany();
    await prisma.ioTDevice.deleteMany();
    await prisma.parkingSpot.deleteMany();
    await prisma.user.deleteMany();
    await prisma.parkingLot.deleteMany();
    await prisma.workplace.deleteMany();

    // 2️⃣ Recriar (Código idêntico ao do seed.ts)

    const workplace = await prisma.workplace.create({
      data: {
        name: "Tech Hub Salvador",
        address: "Av. Tancredo Neves, 450",
        city: "Salvador",
        state: "BA",
        zipCode: "41820-021",
      },
    });

    const parkingLot = await prisma.parkingLot.create({
      data: {
        name: "Estacionamento Principal",
        address: "Av. Tancredo Neves, 450",
        lat: -12.9714,
        lng: -38.5014,
        totalSpots: 100,
        totalElectricSpots: 50,
        totalPCDSpots: 50,
        totalMotorcycleSpots: 50,
        totalGeneralSpots: 50,
        workplaceId: workplace.id,
      },
    });

    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: "João Silva",
          email: "joao@example.com",
          phone: "71999999999",
          vehiclePlate: "ABC-1234",
          workplaceId: workplace.id,
        },
      }),
      prisma.user.create({
        data: {
          name: "Maria Santos",
          email: "maria@example.com",
          phone: "71988888888",
          vehiclePlate: "XYZ-5678",
          workplaceId: workplace.id,
        },
      }),
    ]);

    const spots: any[] = [];
    const spotPool: SpotTypeEnum[] = [ SpotType.GENERAL as SpotTypeEnum, SpotType.GENERAL as SpotTypeEnum, SpotType.GENERAL as SpotTypeEnum, SpotType.PCD as SpotTypeEnum, SpotType.ELECTRIC as SpotTypeEnum, ];

    for (let i = 1; i <= 100; i++) {
      const typeIndex = i <= 10 ? 3 : Math.floor(Math.random() * spotPool.length);
      const type = spotPool[typeIndex];

      const hasCharger = type === SpotType.ELECTRIC ? Math.random() > 0.3 : false;

      spots.push({
        number: `A${i.toString().padStart(3, "0")}`,
        type,
        status: [SpotStatus.FREE, SpotStatus.OCCUPIED, SpotStatus.RESERVED][
          Math.floor(Math.random() * 3)
        ] as SpotStatusEnum,
        floor: Math.floor((i - 1) / 20) + 1,
        section: String.fromCharCode(65 + Math.floor((i - 1) / 10)),
        lat: -12.9714 + (Math.random() - 0.5) * 0.002,
        lng: -38.5014 + (Math.random() - 0.5) * 0.002,
        hasCharger,
        parkingLotId: parkingLot.id,
      });
    }

    await prisma.parkingSpot.createMany({ data: spots });

    // Atualizar totais
    const totalSpots = spots.length;
    const totalCharger = spots.filter((s) => s.hasCharger).length;
    const totalGeneralSpots = spots.filter((s) => s.type === SpotType.GENERAL).length;
    const totalGeneralSpotsCharger = spots.filter(
      (s) => s.type === SpotType.GENERAL && s.hasCharger
    ).length;
    const totalPCDSpots = spots.filter((s) => s.type === SpotType.PCD).length;
    const totalPCDSpotsCharger = spots.filter(
      (s) => s.type === SpotType.PCD && s.hasCharger
    ).length;
    const totalElectricSpots = spots.filter((s) => s.type === SpotType.ELECTRIC).length;
    const totalElectricSpotsCharger = spots.filter(
      (s) => s.type === SpotType.ELECTRIC && s.hasCharger
    ).length;
    const totalMotorcycleSpots = spots.filter((s) => s.type === SpotType.MOTORCYCLE).length;
    const totalMotorcycleSpotsCharger = spots.filter(
      (s) => s.type === SpotType.MOTORCYCLE && s.hasCharger
    ).length;

    await prisma.parkingLot.update({
      where: { id: parkingLot.id },
      data: {
        totalSpots,
        totalCharger,
        totalGeneralSpots,
        totalGeneralSpotsCharger,
        totalPCDSpots,
        totalPCDSpotsCharger,
        totalElectricSpots,
        totalElectricSpotsCharger,
        totalMotorcycleSpots,
        totalMotorcycleSpotsCharger,
      },
    });

    // Criar dispositivos IoT
    const devices = [];
    for (let i = 1; i <= 10; i++) {
      devices.push({
        deviceId: `IOT-${i.toString().padStart(3, "0")}`,
        name: `Sensor Entrada ${i}`,
        type: "CAMERA_SENSOR",
        status: "active",
        location: `Entrada ${Math.ceil(i / 2)}`,
        lastPing: new Date(),
        parkingLotId: parkingLot.id,
      });
    }

    await prisma.ioTDevice.createMany({ data: devices });

    const createdSpots = await prisma.parkingSpot.findMany({ take: 20 });
    const createdDevices = await prisma.ioTDevice.findMany();

    const events: any[] = [];

    for (let i = 0; i < 50; i++) {
      const spot = createdSpots[Math.floor(Math.random() * createdSpots.length)];
      const device = createdDevices[Math.floor(Math.random() * createdDevices.length)];

      events.push({
        id: randomUUID(),
        type: Math.random() > 0.5 ? "ARRIVAL" : "DEPARTURE",
        data: {
          confidence: Math.random(),
          imageUrl: "https://example.com/image.jpg",
        },
        vehiclePlate: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
        deviceId: device.id,
        spotId: spot.id,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
      });
    }

    await prisma.ioTEvent.createMany({ data: events });

    const occupancyLogs = createdSpots.slice(0, 10).map((spot: any) => ({
      entryTime: new Date(Date.now() - Math.random() * 3600000),
      exitTime: Math.random() > 0.5 ? new Date() : null,
      duration: Math.floor(Math.random() * 240),
      vehiclePlate: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
      userId: users[Math.floor(Math.random() * users.length)].id,
      spotId: spot.id,
    }));

    await prisma.occupancyLog.createMany({ data: occupancyLogs });

    return NextResponse.json({ ok: true, message: "Banco resetado e seed recriado!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: true, message: (err as any).message }, { status: 500 });
  }
}
