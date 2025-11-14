import { PrismaClient } from '@prisma/client';
import { IoTEventType, SpotStatus, SpotType } from './generated/prisma/enums';

const prisma = new PrismaClient();

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

  // Criar ParkingLot
  const parkingLot = await prisma.parkingLot.create({
    data: {
      name: 'Estacionamento Principal',
      address: 'Av. Tancredo Neves, 450',
      lat: -12.9714,
      lng: -38.5014,
      totalSpots: 100,
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

  // Criar Vagas
  const spots = [];
  const spotTypes: SpotType[] = ['GENERAL', 'GENERAL', 'GENERAL', 'PCD', 'ELECTRIC'];
  
  for (let i = 1; i <= 100; i++) {
    const typeIndex = i <= 10 ? 3 : Math.floor(Math.random() * spotTypes.length);
    const type = spotTypes[typeIndex];
    
    spots.push({
      number: `A${i.toString().padStart(3, '0')}`,
      type,
      status: ['FREE', 'OCCUPIED', 'RESERVED'][Math.floor(Math.random() * 3)] as SpotStatus,
      floor: Math.floor((i - 1) / 20) + 1,
      section: String.fromCharCode(65 + Math.floor((i - 1) / 10)),
      lat: -12.9714 + (Math.random() - 0.5) * 0.002,
      lng: -38.5014 + (Math.random() - 0.5) * 0.002,
      hasCharger: type === 'ELECTRIC',
      parkingLotId: parkingLot.id,
    });
  }

  await prisma.parkingSpot.createMany({ data: spots });

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

  // Criar Eventos IoT
  const createdSpots = await prisma.parkingSpot.findMany({ take: 20 });
  const createdDevices = await prisma.ioTDevice.findMany();

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