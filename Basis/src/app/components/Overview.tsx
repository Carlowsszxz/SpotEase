import { TrendingUp, TrendingDown, Users, Zap } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = [
  { name: '00:00', value: 4000, value2: 2400 },
  { name: '04:00', value: 3000, value2: 1398 },
  { name: '08:00', value: 2000, value2: 9800 },
  { name: '12:00', value: 2780, value2: 3908 },
  { name: '16:00', value: 1890, value2: 4800 },
  { name: '20:00', value: 2390, value2: 3800 },
  { name: '24:00', value: 3490, value2: 4300 },
];

const barData = [
  { name: 'MON', value: 65 },
  { name: 'TUE', value: 85 },
  { name: 'WED', value: 45 },
  { name: 'THU', value: 95 },
  { name: 'FRI', value: 75 },
  { name: 'SAT', value: 55 },
  { name: 'SUN', value: 70 },
];

export function Overview() {
  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl text-white mb-2">Overview</h1>
        <p className="text-zinc-500">System performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value="24,583"
          change="+12.5%"
          trend="up"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Active Now"
          value="8,429"
          change="+8.2%"
          trend="up"
          icon={<Zap className="w-5 h-5" />}
        />
        <StatCard
          title="Conversion"
          value="68.4%"
          change="-2.1%"
          trend="down"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Efficiency"
          value="94.2%"
          change="+5.7%"
          trend="up"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h3 className="text-lg text-white mb-6">Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          <h3 className="text-lg text-white mb-6">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Multi-line Chart */}
        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg text-white">Dual Stream Analysis</h3>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-zinc-400">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-white rounded-full" />
                <span className="text-zinc-400">Secondary</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#a1a1aa' }}
              />
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="value2" stroke="#ffffff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon }: {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="text-zinc-500">{icon}</div>
        <div className={`flex items-center gap-1 text-sm ${
          trend === 'up' ? 'text-red-500' : 'text-zinc-400'
        }`}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{change}</span>
        </div>
      </div>
      
      <div className="text-3xl text-white mb-1">{value}</div>
      <div className="text-sm text-zinc-500">{title}</div>
    </div>
  );
}