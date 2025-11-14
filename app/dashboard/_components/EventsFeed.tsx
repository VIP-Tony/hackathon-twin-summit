import { Activity, Check, X } from "lucide-react";


export const EventsFeed = ({ events }: { events: any[] }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white">Eventos em Tempo Real</h3>
      <Activity className="w-5 h-5 text-violet-400 animate-pulse" />
    </div>
    
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {events.map((event, idx) => (
        <div 
          key={event.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          <div className={`p-2 rounded-lg ${event.action === 'ARRIVAL' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {event.action === 'ARRIVAL' ? 
              <Check className="w-4 h-4 text-green-400" /> : 
              <X className="w-4 h-4 text-red-400" />
            }
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              Vaga {event.spotNumber} - {event.vehicle}
            </p>
            <p className="text-xs text-gray-400">
              {event.action === 'ARRIVAL' ? 'Entrada' : 'Saída'} • {new Date(event.timestamp).toLocaleTimeString('pt-BR')}
            </p>
          </div>
          
          <span className="text-xs text-gray-500">{event.deviceId}</span>
        </div>
      ))}
    </div>
  </div>
);
