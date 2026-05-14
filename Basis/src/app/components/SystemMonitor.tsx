import { useState, useEffect } from "react";
import { Cpu, HardDrive, Wifi, AlertTriangle } from "lucide-react";

export function SystemMonitor() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl text-white mb-2">System Monitor</h1>
        <p className="text-zinc-500">Real-time system diagnostics</p>
      </div>

      {/* Time Display */}
      <div className="mb-8 p-8 bg-zinc-900 rounded-lg border border-zinc-800">
        <div className="text-5xl text-center text-white mb-2 font-light tracking-wider">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </div>
        <div className="text-center text-zinc-500 text-sm">
          {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <SystemCard
          title="CPU Load"
          value="78.2%"
          status="Optimal"
          icon={<Cpu className="w-6 h-6" />}
        />
        <SystemCard
          title="Storage"
          value="2.4TB"
          status="Active"
          icon={<HardDrive className="w-6 h-6" />}
        />
        <SystemCard
          title="Network"
          value="125ms"
          status="Stable"
          icon={<Wifi className="w-6 h-6" />}
        />
      </div>

      {/* Live Feed */}
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg text-white">System Events</h3>
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>

        <div className="space-y-3 font-mono text-sm">
          <EventLog time="14:23:45" message="System health check completed" status="success" />
          <EventLog time="14:23:42" message="Database backup initiated" status="info" />
          <EventLog time="14:23:38" message="Cache cleared successfully" status="success" />
          <EventLog time="14:23:30" message="High memory usage detected" status="warning" />
          <EventLog time="14:23:25" message="API response time optimized" status="success" />
          <EventLog time="14:23:18" message="New user session started" status="info" />
          <EventLog time="14:23:12" message="Security scan completed" status="success" />
        </div>
      </div>

      {/* Alert Panel */}
      <div className="bg-red-500/10 rounded-lg p-6 border border-red-500/20">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="text-lg text-white mb-2">System Alert</h3>
            <p className="text-zinc-400 mb-4">
              Memory usage has exceeded 85% threshold. Consider scaling resources or optimizing active processes.
            </p>
            <div className="flex gap-3">
              <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm">
                Acknowledge
              </button>
              <button className="bg-zinc-800 text-white px-4 py-2 rounded hover:bg-zinc-700 transition-colors text-sm">
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemCard({ title, value, status, icon }: {
  title: string;
  value: string;
  status: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <div className="text-zinc-500">{icon}</div>
        <div className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-xs">
          {status}
        </div>
      </div>
      <div className="text-3xl text-white mb-2">{value}</div>
      <div className="text-sm text-zinc-500">{title}</div>
    </div>
  );
}

function EventLog({ time, message, status }: {
  time: string;
  message: string;
  status: 'success' | 'warning' | 'info';
}) {
  const color = status === 'success' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-blue-500';
  const bgColor = status === 'success' ? 'bg-green-500/10' : status === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10';

  return (
    <div className={`p-3 ${bgColor} rounded flex items-center gap-3`}>
      <span className={`text-xs ${color} w-20`}>{time}</span>
      <span className="flex-1 text-zinc-300">{message}</span>
      <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
    </div>
  );
}