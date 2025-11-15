import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// é um enum que recebe a chave e retorna a string
type SpotStatus = keyof typeof SpotStatusEnum;

const SpotStatusEnum = {
  FREE: 'FREE',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
};


async function main() {
  console.log('🌱 Seeding database...');

  // Criar Workplace
  const workplace = await prisma.workplace.create({
    data: {
      name: 'Tech Hub Salvador',
      address: 'Av. Tancredo Neves, 450',
      city: 'Salvador',
      state: 'BA',
      zipCode: '41820-021',
    },
  });

  // Criar ParkingLot (cria sem os totais, vamos atualizar depois)
  const parkingLot = await prisma.parkingLot.create({
    data: {
      name: 'Estacionamento Principal',
      address: 'Av. Tancredo Neves, 450',
      lat: -12.9714,
      lng: -38.5014,
      totalSpots: 100, // preenchido inicialmente; outros totais serão atualizados
      workplaceId: workplace.id,
    },
  });

  // Criar Usuários
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'João Silva',
        email: 'joao@example.com',
        phone: '71999999999',
        vehiclePlate: 'ABC-1234',
        workplaceId: workplace.id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@example.com',
        phone: '71988888888',
        vehiclePlate: 'XYZ-5678',
        workplaceId: workplace.id,
      },
    }),
  ]);

  // Criar Vagas (spots)
  const spots: {
    number: string;
    type: SpotType;
    status: SpotStatus;
    floor: number;
    section: string;
    lat: number;
    lng: number;
    hasCharger: boolean;
    parkingLotId: string;
  }[] = [];

  const spotPool: SpotType[] = [
    SpotType.GENERAL,
    SpotType.GENERAL,
    SpotType.GENERAL,
    SpotType.PCD,
    SpotType.ELECTRIC,
  ];

  for (let i = 1; i <= 100; i++) {
    // garantir pelo menos 10 PCD nos primeiros 10
    const typeIndex = i <= 10 ? 3 : Math.floor(Math.random() * spotPool.length);
    const type = spotPool[typeIndex];

    const hasCharger = type === SpotType.ELECTRIC ? Math.random() > 0.3 : false; // ~70% das elétricas tem carregador

    spots.push({
      number: `A${i.toString().padStart(3, '0')}`,
      type,
      status: [SpotStatus.FREE, SpotStatus.OCCUPIED, SpotStatus.RESERVED][
        Math.floor(Math.random() * 3)
      ] as SpotStatus,
      floor: Math.floor((i - 1) / 20) + 1,
      section: String.fromCharCode(65 + Math.floor((i - 1) / 10)),
      lat: -12.9714 + (Math.random() - 0.5) * 0.002,
      lng: -38.5014 + (Math.random() - 0.5) * 0.002,
      hasCharger,
      parkingLotId: parkingLot.id,
    });
  }

  // Inserir todos os spots
  await prisma.parkingSpot.createMany({ data: spots });

  // Atualizar totais do parkingLot de acordo com os spots gerados
  const totalSpots = spots.length;
  const totalCharger = spots.filter((s) => s.hasCharger).length;
  const totalGeneralSpots = spots.filter((s) => s.type === SpotType.GENERAL).length;
  const totalGeneralSpotsCharger = spots.filter(
    (s) => s.type === SpotType.GENERAL && s.hasCharger
  ).length;
  const totalPCDSpots = spots.filter((s) => s.type === SpotType.PCD).length;
  const totalPCDSpotsCharger = spots.filter((s) => s.type === SpotType.PCD && s.hasCharger).length;
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

  // Criar Dispositivos IoT
  const devices = [];
  for (let i = 1; i <= 10; i++) {
    devices.push({
      deviceId: `IOT-${i.toString().padStart(3, '0')}`,
      name: `Sensor Entrada ${i}`,
      type: 'CAMERA_SENSOR',
      status: 'active',
      location: `Entrada ${Math.ceil(i / 2)}`,
      lastPing: new Date(),
      parkingLotId: parkingLot.id,
    });
  }

  await prisma.ioTDevice.createMany({ data: devices });

  // Buscar alguns spots e devices para gerar eventos
  const createdSpots = await prisma.parkingSpot.findMany({ take: 20 });
  const createdDevices = await prisma.ioTDevice.findMany();

  // Criar Eventos IoT
  const events = [];
  for (let i = 0; i < 50; i++) {
    const spot = createdSpots[Math.floor(Math.random() * createdSpots.length)];
    const device = createdDevices[Math.floor(Math.random() * createdDevices.length)];

    events.push({
      type: Math.random() > 0.5 ? IoTEventType.ARRIVAL : IoTEventType.DEPARTURE,
      data: {
        confidence: Math.random(),
        imageUrl: 'https://example.com/image.jpg',
      },
      vehiclePlate: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
      deviceId: device.id,
      spotId: spot.id,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
    });
  }

  await prisma.ioTEvent.createMany({ data: events });

  // Criar Logs de Ocupação
  const occupancyLogs = createdSpots.slice(0, 10).map((spot: any) => ({
    entryTime: new Date(Date.now() - Math.random() * 3600000),
    exitTime: Math.random() > 0.5 ? new Date() : null,
    duration: Math.floor(Math.random() * 240),
    vehiclePlate: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
    userId: users[Math.floor(Math.random() * users.length)].id,
    spotId: spot.id,
  }));

  await prisma.occupancyLog.createMany({ data: occupancyLogs });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
