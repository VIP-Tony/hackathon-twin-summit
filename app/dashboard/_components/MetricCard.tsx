type MetricCardProps = {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: number;
    color?: string
}
export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'violet' }: MetricCardProps) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-violet-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {trend && (
            <span className={`text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg bg-${color}-500/10`}>
        <Icon className={`w-6 h-6 text-${color}-400`} />
      </div>
    </div>
  </div>
);