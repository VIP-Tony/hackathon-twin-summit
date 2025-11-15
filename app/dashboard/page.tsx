"use client";
import { SPOT_STATUS, SPOT_TYPES } from "@/components/SpotsStatusAndTypes";
import { Car, Check, Clock, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SpotType } from "@/lib/generated/prisma/enums";
import { MetricCard } from "./_components/MetricCard";
import { ParkingMap } from "./_components/ParkingMap";
import { EventsFeed } from "./_components/EventsFeed";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

interface StatsByType {
  [key: string]: any[];
}

interface DashboardData {
  spots: any[];
  events: any[];
  hourlyData: any[];
  stats: {
    total: number;
    occupied: number;
    free: number;
    reserved: number;
    byType: {
      GENERAL: number;
      PCD: number;
      ELECTRIC: number;
      MOTORCYCLE: number;
    };
  };
}

export default function ParkingDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SpotType | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);

  // Função para buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Erro ao buscar dados do dashboard');
      }
      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAplication = async () => {
     try {
      await fetch("/api/simulacao/start", {
        method: "POST",
      })
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      // nada
    }
  };

  const handleEraseDatabase = async () => {
    try {
      await fetch("/api/dev/reset-database", {
        method: "POST",
      })
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      // nada
    }
  };

  // Buscar dados iniciais
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Atualizar dados a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;

    const { spots, stats: apiStats } = data;

    const byType: StatsByType = {
      GENERAL: spots.filter(s => s.type === 'GENERAL'),
      PCD: spots.filter(s => s.type === 'PCD'),
      ELECTRIC: spots.filter(s => s.type === 'ELECTRIC'),
      MOTORCYCLE: spots.filter(s => s.type === 'MOTORCYCLE')
    };

    return {
      ...apiStats,
      byType,
      occupancyRate: ((apiStats.occupied / apiStats.total) * 100).toFixed(1)
    };
  }, [data]);

  const chartData = useMemo(() => {
    if (!stats) return [];

    return [
      { name: 'Geral', value: stats.byType.GENERAL.length, color: '#7C3AED' },
      { name: 'PCD', value: stats.byType.PCD.length, color: '#3B82F6' },
      { name: 'Elétrico', value: stats.byType.ELECTRIC.length, color: '#10B981' },
      { name: 'Moto', value: stats.byType.MOTORCYCLE.length, color: '#F59E0B' }
    ];
  }, [stats]);

  const chartConfig = chartData.reduce((acc, entry, idx) => {
    acc[entry.name] = {
      label: entry.name,
      // usa a cor da sua entrada
      color: entry.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  const chartConfig2 = {
    ocupacao: {
      label: "Ocupação",
      color: "#7C3AED", // roxo, por exemplo
    },
    reservas: {
      label: "Reservas",
      color: "#10B981", // verde
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-400">Erro ao carregar dados: {error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboardData();
            }}
            className="mt-4 px-6 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data || !stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-linear-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
              Dashboard do Estacionamento
            </h1>
            <p className="text-gray-400 mt-1">Monitoramento em tempo real</p>
          </div>
          <div className="flex flex-row items-center gap-2">
            <Button onClick={handleTestAplication} variant="default" size="sm" className="px-4 py-2 h-10 rounded-lg cursor-pointer bg-violet-500/60 hover:bg-violet-600 border border-gray-800">
              Testar Aplicação
            </Button>
            <Button onClick={handleEraseDatabase} variant="default" size="sm" className="px-4 py-2 h-10 rounded-lg cursor-pointer bg-orange-500/60 hover:bg-orange-600 border border-gray-800">
              Limpar Banco de Dados
            </Button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-800">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-sm text-gray-300">Sistema Ativo</span>
          </div>
          </div>
        </div>

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

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${!selectedType ? 'bg-violet-500 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
              }`}
          >
            Todos ({data.spots.length})
          </button>
          {Object.entries(SPOT_TYPES).map(([key, type]) => {
            const Icon = type.icon;
            const count = stats.byType[key]?.length || 0;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key as SpotType)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${selectedType === key ? 'bg-violet-500 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {type.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ParkingMap
              spots={data.spots}
              selectedType={selectedType}
              onSpotClick={setSelectedSpot}
              selectedLot={"Estacionamento 1"}
            />
          </div>
          <div>
            <EventsFeed events={data.events} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Tipo</h3>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full">

              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="var(--color-??)"
                  label
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                <ChartTooltip content={<ChartTooltipContent />} />

                <ChartLegend content={<ChartLegendContent nameKey="name" />} />

              </PieChart>

            </ChartContainer>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Ocupação por Hora</h3>
            <ChartContainer config={chartConfig2} className="min-h-[250px] w-full">
              <LineChart
                data={data.hourlyData}
                accessibilityLayer // adiciona layer acessível (recomendado) :contentReference[oaicite:0]{index=0}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="hour" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="ocupacao"
                  stroke="var(--color-ocupacao)" // usa variável de cor do config
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="reservas"
                  stroke="var(--color-reservas)" // usa variável de cor do config
                  strokeWidth={2}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

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
                <div>
                  <h3 className="text-xl font-bold text-white">Vaga {selectedSpot.number}</h3>
                  <p className="text-gray-400 text-sm mt-1">Estacionamento {selectedSpot.parkingLot} - Setor {selectedSpot.sector}</p>
                </div>
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
                  <span className={`font-medium ${selectedSpot.status === 'FREE' ? 'text-green-400' :
                      selectedSpot.status === 'OCCUPIED' ? 'text-red-400' :
                        'text-yellow-400'
                    }`}>
                    {SPOT_STATUS[selectedSpot.status].label}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <span className="text-gray-400">Última Atualização</span>
                  <span className="text-white text-sm">
                    {new Date(selectedSpot.lastUpdate).toLocaleString('pt-BR')}
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