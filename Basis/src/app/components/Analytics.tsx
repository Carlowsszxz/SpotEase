import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Target, Eye, MousePointer, Clock } from "lucide-react";

const radarData = [
  { subject: 'Speed', A: 120, fullMark: 150 },
  { subject: 'Stability', A: 98, fullMark: 150 },
  { subject: 'Security', A: 86, fullMark: 150 },
  { subject: 'Scale', A: 99, fullMark: 150 },
  { subject: 'Uptime', A: 85, fullMark: 150 },
  { subject: 'Response', A: 65, fullMark: 150 },
];

const pieData = [
  { name: 'Active', value: 400 },
  { name: 'Idle', value: 300 },
  { name: 'Offline', value: 200 },
];

const COLORS = ['#ef4444', '#71717a', '#3f3f46'];

const metrics = [
  { label: 'Avg Response Time', value: '142ms', icon: <Clock className="w-5 h-5" /> },
  { label: 'Page Views', value: '1.2M', icon: <Eye className="w-5 h-5" /> },
  { label: 'Click Rate', value: '8.4%', icon: <MousePointer className="w-5 h-5" /> },
  { label: 'Conversion Goal', value: '92%', icon: <Target className="w-5 h-5" /> },
];

export function Analytics() {
  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl text-white mb-2">Analytics</h1>
        <p className="text-zinc-500">Deep dive performance analysis</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-zinc-900 rounded-lg p-6 border border-zinc-800"
          >
            <div className="text-zinc-500 mb-3">{metric.icon}</div>
            <div className="text-2xl text-white mb-1">{metric.value}</div>
            <div className="text-sm text-zinc-500">{metric.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h3 className="text-lg text-white mb-6">System Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis dataKey="subject" stroke="#71717a" />
              <PolarRadiusAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Radar name="Performance" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h3 className="text-lg text-white mb-6">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="#18181b"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#a1a1aa' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span className="text-sm text-zinc-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bars Section */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 lg:col-span-2">
          <h3 className="text-lg text-white mb-6">Resource Utilization</h3>
          <div className="space-y-6">
            <ProgressBar label="CPU Usage" value={78} />
            <ProgressBar label="Memory" value={65} />
            <ProgressBar label="Storage" value={92} />
            <ProgressBar label="Bandwidth" value={54} />
            <ProgressBar label="Network I/O" value={88} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-zinc-400">{label}</span>
        <span className="text-sm text-zinc-400">{value}%</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-500 rounded-full transition-all duration-1000"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}