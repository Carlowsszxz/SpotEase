import { useState, useEffect } from "react";
import { Signal, Server, Database, Globe } from "lucide-react";

interface DataPoint {
  id: string;
  source: string;
  value: number;
  timestamp: string;
}

export function DataStream() {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);

  useEffect(() => {
    // Simulate real-time data stream
    const sources = ['NODE-01', 'NODE-02', 'NODE-03', 'NODE-04'];
    const interval = setInterval(() => {
      const newPoint: DataPoint = {
        id: Math.random().toString(36).substring(7),
        source: sources[Math.floor(Math.random() * sources.length)],
        value: Math.floor(Math.random() * 100),
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      };

      setDataPoints(prev => [newPoint, ...prev].slice(0, 20));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 bg-black min-h-screen">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl text-white mb-2">Data Stream</h1>
        <p className="text-zinc-500">Live data transmission monitor</p>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <ConnectionNode 
          name="Gateway A" 
          status="Active" 
          ping={12} 
          icon={<Globe className="w-5 h-5" />}
        />
        <ConnectionNode 
          name="Server Main" 
          status="Active" 
          ping={8} 
          icon={<Server className="w-5 h-5" />}
        />
        <ConnectionNode 
          name="Database 01" 
          status="Active" 
          ping={15} 
          icon={<Database className="w-5 h-5" />}
        />
        <ConnectionNode 
          name="Edge Node" 
          status="Active" 
          ping={22} 
          icon={<Signal className="w-5 h-5" />}
        />
      </div>

      {/* Live Data Feed */}
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg text-white">Incoming Data</h3>
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>Streaming</span>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dataPoints.map((point) => (
            <div
              key={point.id}
              className="bg-zinc-800 rounded p-4 flex items-center justify-between border border-zinc-700 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                  {point.source}
                </div>
                <div className="font-mono text-sm text-zinc-400">{point.timestamp}</div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xl text-white">{point.value}</div>
                <div className="w-16 h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300" 
                    style={{ width: `${point.value}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {dataPoints.length === 0 && (
            <div className="text-center text-zinc-500 py-12">
              Waiting for data stream...
            </div>
          )}
        </div>
      </div>

      {/* Network Diagram */}
      <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
        <h3 className="text-lg text-white mb-8">Network Topology</h3>
        
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {/* Central Hub */}
          <div className="relative">
            <div className="w-20 h-20 rounded-lg bg-red-500 flex items-center justify-center">
              <Database className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-3 py-1 rounded text-xs whitespace-nowrap">
              Core
            </div>
          </div>

          {/* Connected Nodes */}
          <div className="grid grid-cols-2 gap-4">
            {['Node A', 'Node B', 'Node C', 'Node D'].map((node) => (
              <div key={node} className="relative">
                <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center border-2 border-zinc-700 hover:border-red-500 transition-colors">
                  <div className="w-6 h-6 bg-zinc-700 rounded" />
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500 whitespace-nowrap">
                  {node}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionNode({ name, status, ping, icon }: {
  name: string;
  status: string;
  ping: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className="text-zinc-500">{icon}</div>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      </div>
      <div className="text-lg text-white mb-1">{name}</div>
      <div className="text-xs text-zinc-500">{status} • {ping}ms</div>
    </div>
  );
}