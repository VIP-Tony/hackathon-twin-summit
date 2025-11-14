"use client";
import { SPOT_STATUS, SPOT_TYPES } from "@/components/SpotsStatusAndTypes";
import { Car, Check, Clock, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricCard } from "./_components/MetricCard";
import { ParkingMap } from "./_components/ParkingMap";
import { EventsFeed } from "./_components/EventsFeed";
import { ParkingSpot, SpotType } from "@/lib/generated/prisma/client";

// Dados mockados
const generateSpots = () => {
  const spots = [];
  const statuses = ['FREE', 'OCCUPIED', 'RESERVED'];
  const types = ['GENERAL', 'PCD', 'ELECTRIC'];
  
  for (let i = 1; i <= 50; i++) {
    spots.push({
      id: i,
      number: `A${i.toString().padStart(3, '0')}`,
      type: types[Math.floor(Math.random() * (i < 10 ? 2 : 3))],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lat: -12.9714 + (Math.random() - 0.5) * 0.001,
      lng: -38.5014 + (Math.random() - 0.5) * 0.001,
      lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString()
    });
  }
  return spots;
};

const generateEvents = () => {
  const events = [];
  const actions = ['ARRIVAL', 'DEPARTURE'];
  
  for (let i = 0; i < 15; i++) {
    events.push({
      id: i,
      deviceId: `IOT-${Math.floor(Math.random() * 10) + 1}`,
      spotNumber: `A${Math.floor(Math.random() * 50 + 1).toString().padStart(3, '0')}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      vehicle: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
      timestamp: new Date(Date.now() - Math.random() * 7200000).toISOString()
    });
  }
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
};

const generateHourlyData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      hour: `${i}:00`,
      ocupacao: Math.floor(Math.random() * 40) + 10,
      reservas: Math.floor(Math.random() * 15)
    });
  }
  return data;
};

export default function ParkingDashboard() {
  const [spots, setSpots] = useState<any[]>(generateSpots());
  const [events, setEvents] = useState<any[]>(generateEvents());
  const [selectedType, setSelectedType] = useState<SpotType | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);

  // Simular WebSocket updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSpots(prev => {
        const newSpots = [...prev];
        const randomIdx = Math.floor(Math.random() * newSpots.length);
        const statuses = ['FREE', 'OCCUPIED', 'RESERVED'];
        newSpots[randomIdx] = {
          ...newSpots[randomIdx],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          lastUpdate: new Date().toISOString()
        };
        return newSpots;
      });

      setEvents(prev => {
        const newEvent = {
          id: Date.now(),
          deviceId: `IOT-${Math.floor(Math.random() * 10) + 1}`,
          spotNumber: `A${Math.floor(Math.random() * 50 + 1).toString().padStart(3, '0')}`,
          action: Math.random() > 0.5 ? 'ARRIVAL' : 'DEPARTURE',
          vehicle: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
          timestamp: new Date().toISOString()
        };
        return [newEvent, ...prev.slice(0, 14)];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = spots.length;
    const occupied = spots.filter(s => s.status === 'OCCUPIED').length;
    const free = spots.filter(s => s.status === 'FREE').length;
    const reserved = spots.filter(s => s.status === 'RESERVED').length;
    
    const byType: Record<SpotType, ParkingSpot[]> = {
      GENERAL: spots.filter(s => s.type === 'GENERAL'),
      PCD: spots.filter(s => s.type === 'PCD'),
      ELECTRIC: spots.filter(s => s.type === 'ELECTRIC')
    };

    return { total, occupied, free, reserved, byType, occupancyRate: ((occupied / total) * 100).toFixed(1) };
  }, [spots]);

  const chartData = useMemo(() => [
    { name: 'Geral', value: stats.byType.GENERAL.length, color: '#7C3AED' },
    { name: 'PCD', value: stats.byType.PCD.length, color: '#3B82F6' },
    { name: 'Elétrico', value: stats.byType.ELECTRIC.length, color: '#10B981' }
  ], [stats]);

  const hourlyData = useMemo(() => generateHourlyData(), []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
              Dashboard do Estacionamento
            </h1>
            <p className="text-gray-400 mt-1">Monitoramento em tempo real</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-800">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm text-gray-300">Sistema Ativo</span>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Taxa de Ocupação"
            value={`${stats.occupancyRate}%`}
            subtitle={`${stats.occupied} de ${stats.total} vagas`}
            icon={TrendingUp}
            trend={2.5}
            color="violet"
          />
          <MetricCard
            title="Vagas Livres"
            value={stats.free}
            subtitle="Disponíveis agora"
            icon={Check}
            color="green"
          />
          <MetricCard
            title="Vagas Ocupadas"
            value={stats.occupied}
            subtitle="Em uso"
            icon={Car}
            color="red"
          />
          <MetricCard
            title="Reservadas"
            value={stats.reserved}
            subtitle="Aguardando"
            icon={Clock}
            color="yellow"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              !selectedType 
                ? 'bg-violet-500 text-white' 
                : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Todos ({spots.length})
          </button>
          {Object.entries(SPOT_TYPES).map(([key, type]) => {
            const Icon = type.icon;
            const typedKey = key as SpotType;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key as SpotType)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedType === key
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label} ({stats.byType[typedKey].length})
              </button>
            );
          })}
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ParkingMap
              spots={spots} 
              selectedType={selectedType}
              onSpotClick={setSelectedSpot}
            />
          </div>
          
          <div>
            <EventsFeed events={events} />
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Tipo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ocupação por Hora</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                />
                <Line type="monotone" dataKey="ocupacao" stroke="#7C3AED" strokeWidth={2} />
                <Line type="monotone" dataKey="reservas" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modal de Detalhes da Vaga */}
        {selectedSpot && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSpot(null)}
          >
            <div 
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Vaga {selectedSpot.number}</h3>
                <button 
                  onClick={() => setSelectedSpot(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Tipo</span>
                  <span className="text-white font-medium">{SPOT_TYPES[selectedSpot.type].label}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${
                    selectedSpot.status === 'FREE' ? 'text-green-400' :
                    selectedSpot.status === 'OCCUPIED' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {SPOT_STATUS[selectedSpot.status].label}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Última Atualização</span>
                  <span className="text-white text-sm">
                    {new Date(selectedSpot.updatedAt).toLocaleString('pt-BR')}
                  </span>
                </div>

                <div className="flex gap-2 pt-4">
                  {selectedSpot.status === 'FREE' && (
                    <button className="flex-1 px-4 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg font-medium transition-colors">
                      Reservar
                    </button>
                  )}
                  {selectedSpot.status === 'OCCUPIED' && (
                    <button className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors">
                      Liberar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}