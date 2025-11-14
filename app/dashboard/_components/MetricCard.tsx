type MetricCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: number;
    color?: string
}
export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'violet' }: MetricCardProps) => (
   <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
      {trend && (
        <span className="text-green-400 text-sm font-medium">+{trend}%</span>
      )}
    </div>
    <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
    <p className="text-3xl font-bold text-white mb-1">{value}</p>
    <p className="text-gray-500 text-sm">{subtitle}</p>
  </div>
);