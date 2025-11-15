import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { faker } from '@faker-js/faker/locale/pt_BR';

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

const SpotPrefix: Record<string, string> = {
    GENERAL: 'C',
    PCD: 'PCD',
    ELECTRIC: 'EL',
    MOTORCYCLE: 'M',
};

type SpotTypeEnum = keyof typeof SpotType;

const IoTEventType = {
    ARRIVAL: 'ARRIVAL',
    DEPARTURE: 'DEPARTURE',
};

type IoTEventTypeEnum = keyof typeof IoTEventType;

export async function POST() {
    try {
        console.log('🚨 Resetando o banco e recriando dados...');

        // 1️⃣ Apagar tudo na ordem segura
        await prisma.ioTEvent.deleteMany();
        await prisma.occupancyLog.deleteMany();
        await prisma.ioTDevice.deleteMany();
        await prisma.parkingSpot.deleteMany();
        await prisma.user.deleteMany();
        await prisma.parkingLot.deleteMany();
        await prisma.workplace.deleteMany();

        // 2️⃣ Recriar (Código idêntico ao do seed.ts)

        const workplace1 = await prisma.workplace.create({
            data: {
                name: 'Setor A',
                address: 'Av. Tancredo Neves, 450',
                city: 'Salvador',
                state: 'BA',
                zipCode: '41820-021',
            },
        });

        const parkingLot1 = await prisma.parkingLot.create({
            data: {
                name: 'Estacionamento 1',
                address: 'Av. Tancredo Neves, 450',
                lat: -12.9714,
                lng: -38.5014,
                totalSpots: 86,
                totalElectricSpots: 3,
                totalPCDSpots: 5,
                totalMotorcycleSpots: 18,
                totalGeneralSpots: 60,
                workplaceId: workplace1.id,
            },
        });

        const workplace2 = await prisma.workplace.create({
            data: {
                name: 'Setor B',
                address: 'Av. Tancredo Neves, 456',
                city: 'Salvador',
                state: 'BA',
                zipCode: '41320-025',
            },
        });

        const parkingLot2 = await prisma.parkingLot.create({
            data: {
                name: 'Estacionamento 2',
                address: 'Av. Tancredo Neves, 450',
                lat: -12.9714,
                lng: -38.5014,
                totalSpots: 109,
                totalElectricSpots: 5,
                totalPCDSpots: 2,
                totalMotorcycleSpots: 6,
                totalGeneralSpots: 96,
                workplaceId: workplace1.id,
            },
        });

        function generatePlate(i: number): string {
            // Converte índice em uma placa no padrão AAA-0000
            const letters = String.fromCharCode(
                65 + (i % 26),
                65 + ((i / 26) % 26),
                65 + ((i / 676) % 26)
            );
            const numbers = String(i % 10000).padStart(4, '0');

            return `${letters}-${numbers}`;
        }

        async function seedUsers() {
            const total = 175;
            const half = Math.floor(total / 2);

            const usersData = [];

            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const fullName = `${firstName} ${lastName}`;

            for (let i = 0; i < total; i++) {
                const workplaceId = i < half ? workplace1.id : workplace2.id;

                usersData.push({
                    name: fullName,
                    email: `usuario${i + 1}@example.com`,
                    phone: `71${(90000000 + i).toString()}`,
                    vehiclePlate: generatePlate(i),
                    workplaceId,
                });
            }

            const users = await Promise.all(
                usersData.map((u) => prisma.user.create({ data: u }))
            );

            return users;
        }

        const users = await seedUsers();

        const spotPool: SpotTypeEnum[] = [
            SpotType.GENERAL as SpotTypeEnum,
            SpotType.GENERAL as SpotTypeEnum,
            SpotType.GENERAL as SpotTypeEnum,
            SpotType.PCD as SpotTypeEnum,
            SpotType.ELECTRIC as SpotTypeEnum,
        ];

        function generateSpotsForParkingLot(
            parkingLot: any,
            parking_index: string
        ) {
            const {
                id: parkingLotId,
                name,
                totalGeneralSpots,
                totalPCDSpots,
                totalElectricSpots,
                totalMotorcycleSpots,
            } = parkingLot;

            const definitions = [
                { type: SpotType.GENERAL, count: totalGeneralSpots },
                { type: SpotType.PCD, count: totalPCDSpots },
                { type: SpotType.ELECTRIC, count: totalElectricSpots },
                { type: SpotType.MOTORCYCLE, count: totalMotorcycleSpots },
            ];

            const result: any[] = [];
            let index = 1;

            for (const def of definitions) {
                for (let i = 1; i <= def.count; i++) {
                    const number = `E${parking_index}${SpotPrefix[def.type]
                        }${index.toString()}`;

                    result.push({
                        number,
                        type: def.type,
                        status: SpotStatus.FREE,

                        floor: Math.floor((index - 1) / 20) + 1,
                        section: String.fromCharCode(65 + Math.floor((index - 1) / 10)),

                        lat: parkingLot.lat + (Math.random() - 0.5) * 0.002,
                        lng: parkingLot.lng + (Math.random() - 0.5) * 0.002,

                        hasCharger: def.type === SpotType.ELECTRIC,
                        parkingLotId,
                    });

                    index++;
                }
            }

            return result;
        }

        const spotsParkingLot1 = generateSpotsForParkingLot(parkingLot1, '1');
        const spotsParkingLot2 = generateSpotsForParkingLot(parkingLot2, '2');

        const spots = [...spotsParkingLot1, ...spotsParkingLot2];

        await prisma.parkingSpot.createMany({ data: spots });

        const devices = [];
        for (let i = 1; i <= 10; i++) {
            devices.push({
                deviceId: `IOT-${i.toString().padStart(3, '0')}`,
                name: `Sensor Entrada ${i}`,
                type: 'CAMERA_SENSOR',
                status: 'active',
                location: `Entrada ${Math.ceil(i / 2)}`,
                lastPing: new Date(),
                parkingLotId: parkingLot1.id,
            });
        }

        await prisma.ioTDevice.createMany({ data: devices });

        // const createdSpots = await prisma.parkingSpot.findMany({ take: 20 });
        // const createdDevices = await prisma.ioTDevice.findMany();

        // const events: any[] = [];

        // for (let i = 0; i < 50; i++) {
        // 	const spot =
        // 		createdSpots[Math.floor(Math.random() * createdSpots.length)];
        // 	const device =
        // 		createdDevices[Math.floor(Math.random() * createdDevices.length)];

        // 	events.push({
        // 		id: randomUUID(),
        // 		type: Math.random() > 0.5 ? 'ARRIVAL' : 'DEPARTURE',
        // 		data: {
        // 			confidence: Math.random(),
        // 			imageUrl: 'https://example.com/image.jpg',
        // 		},
        // 		vehiclePlate: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
        // 		deviceId: device.id,
        // 		spotId: spot.id,
        // 		timestamp: new Date(Date.now() - Math.random() * 86400000),
        // 	});
        // }

        // await prisma.ioTEvent.createMany({ data: events });

        // const occupancyLogs = createdSpots.slice(0, 10).map((spot: any) => ({
        // 	entryTime: new Date(Date.now() - Math.random() * 3600000),
        // 	exitTime: Math.random() > 0.5 ? new Date() : null,
        // 	duration: Math.floor(Math.random() * 240),
        // 	vehiclePlate: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
        // 	userId: users[Math.floor(Math.random() * users.length)].id,
        // 	spotId: spot.id,
        // }));

        // await prisma.occupancyLog.createMany({ data: occupancyLogs });

        return NextResponse.json({
            ok: true,
            message: 'Banco resetado e seed recriado!',
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: true, message: (err as any).message },
            { status: 500 }
        );
    }
}
