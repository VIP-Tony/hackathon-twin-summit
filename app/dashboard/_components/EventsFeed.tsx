import { Activity, Check, X } from "lucide-react";


export const EventsFeed = ({ events }: { events: any[] }) => (
   <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-full">
    <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>
    <div className="space-y-3 max-h-[550px] overflow-y-auto custom-scrollbar">
      {events.map(event => (
        <div key={event.id} className="p-3 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-medium">{event.spotNumber}</span>
            <span className="text-xs text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString('pt-BR')}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {event.action === 'ARRIVAL' ? '🚗 Entrada' : '🚙 Saída'} - {event.vehicle}
          </div>
        </div>
      ))}
    </div>
  </div>
);
