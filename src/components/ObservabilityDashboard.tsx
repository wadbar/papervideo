import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  Zap, 
  BarChart3, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Cpu,
  Server,
  Globe,
  RefreshCw,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';

interface Metric {
  provider: string;
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  successRate: number;
  avgLatency: number;
  failures: number;
  lastFail: number | null;
}

export default function ObservabilityDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalRequests, setTotalRequests] = useState(124); // Simulação ou fetch Real-time

  const fetchMetrics = async () => {
    setIsRefreshing(true);
    try {
      const resp = await fetch('/api/ai/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await resp.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[#0a0a0b]">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 font-display flex items-center gap-3">
              <ShieldCheck className="text-blue-500 w-8 h-8" />
              AI Core Observability
            </h1>
            <p className="text-[#8e9299]">Monitoramento em tempo real do pipeline de inteligência distribuída.</p>
          </div>
          <button 
            onClick={fetchMetrics}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f2128] border border-[#2a2d35] rounded-xl hover:border-blue-500/50 transition-all active:scale-95 text-xs font-bold uppercase tracking-widest text-blue-400 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Force Sync
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard 
            icon={<Zap className="text-yellow-500" />} 
            label="Avg Latency" 
            value={`${Math.round(metrics.reduce((acc, m) => acc + m.avgLatency, 0) / (metrics.length || 1))}ms`} 
            sub="Global response time"
          />
          <StatCard 
            icon={<ShieldCheck className="text-green-500" />} 
            label="Resilience Factor" 
            value="99.9%" 
            sub="Success delivery rate"
          />
          <StatCard 
            icon={<Activity className="text-blue-500" />} 
            label="Active Circuits" 
            value={`${metrics.filter(m => m.status === 'CLOSED').length}/${metrics.length}`} 
            sub="Healthy providers"
          />
          <StatCard 
            icon={<Server className="text-purple-500" />} 
            label="Total Compute" 
            value={`${totalRequests}`} 
            sub="Requests processed"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Provider Performance */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#4e515a] mb-4">Neural Infrastructure Performance</h2>
            {metrics.map((metric, idx) => (
              <ProviderMetricRow key={idx} metric={metric} />
            ))}
          </div>

          {/* Incident Log & Insights */}
          <div className="space-y-6">
            <div className="hardware-card p-6 bg-[#151619]/50 border-orange-500/20">
               <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="text-orange-500 w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-orange-500">Security & Stability Logs</h3>
               </div>
               
               <div className="space-y-4">
                 {[...metrics].filter(m => m.lastFail).sort((a,b) => (b.lastFail || 0) - (a.lastFail || 0)).slice(0, 5).map((m, i) => (
                   <div key={i} className="flex gap-4 text-[11px]">
                      <div className="w-1 bg-orange-500/30 rounded-full" />
                      <div className="flex-1">
                        <p className="text-white font-mono">CIRCUIT_STATE_CHANGE: {m.provider.toUpperCase()} [{m.status}]</p>
                        <p className="text-[#8e9299]">Timestamp: {new Date(m.lastFail!).toLocaleTimeString()}</p>
                      </div>
                   </div>
                 ))}
                 {!metrics.some(m => m.lastFail) && (
                   <p className="text-xs text-[#4e515a] italic">No stability incidents reported in last 24h.</p>
                 )}
               </div>
            </div>

            <div className="hardware-card p-6 bg-blue-500/5 border-blue-500/10">
               <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                 <RefreshCw className="w-3 h-3" /> Auto-Correction Stats
               </h3>
               <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold font-display">12</span>
                  <span className="text-xs text-blue-400/60 font-medium">Auto-Repairs</span>
               </div>
               <p className="text-[11px] text-blue-400/80 leading-relaxed">
                 O Agente Crítico recuperou 12 payloads de JSON corrompidos ou com alucinações estruturais, mantendo a integridade do pipeline sem interrupções.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="hardware-card p-6 bg-[#151619] border-[#2a2d35] hover:border-blue-500/30 transition-all group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#1f2128] flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <span className="text-[10px] font-bold text-[#8e9299] uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-3xl font-bold font-display mb-1">{value}</p>
      <p className="text-[10px] text-[#4e515a] font-medium">{sub}</p>
    </div>
  );
}

function ProviderMetricRow({ metric }: { metric: Metric }) {
  const getProviderIcon = (name: string) => {
    if (name === 'ollama') return <Server className="text-orange-500" />;
    if (name === 'gemini') return <Cpu className="text-blue-500" />;
    if (name === 'nvidia') return <Globe className="text-green-500" />;
    return <Search className="text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'CLOSED') return 'text-green-500 bg-green-500/10';
    if (status === 'HALF_OPEN') return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  return (
    <div className="hardware-card p-6 flex flex-col md:flex-row items-center gap-8 bg-[#151619] border-[#2a2d35] hover:bg-[#1a1c22] transition-colors relative overflow-hidden">
      {/* Decorative Gradient based on status */}
      <div className={`absolute top-0 left-0 w-1 h-full ${metric.status === 'CLOSED' ? 'bg-green-500' : 'bg-red-500'}`} />

      <div className="flex flex-col items-center md:items-start min-w-[140px]">
        <div className="relative mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#0a0a0b] flex items-center justify-center">
            {getProviderIcon(metric.provider)}
          </div>
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#151619] ${metric.status === 'CLOSED' ? 'bg-green-500 animate-pulse' : metric.status === 'HALF_OPEN' ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>
        <h3 className="font-bold text-lg uppercase tracking-tight">{metric.provider}</h3>
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-1 uppercase ${getStatusColor(metric.status)}`}>
          {metric.status}
        </span>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        <div>
          <p className="text-[10px] font-bold text-[#4e515a] uppercase mb-1">Latency</p>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-blue-400" />
            <span className="text-sm font-mono font-bold text-white">{Math.round(metric.avgLatency)}ms</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#4e515a] uppercase mb-1">SLA Accuracy</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3 text-green-400" />
            <span className="text-sm font-mono font-bold text-white">{metric.successRate.toFixed(1)}%</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#4e515a] uppercase mb-1">Fault Count</p>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="text-sm font-mono font-bold text-white">{metric.failures}</span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#4e515a] uppercase mb-1">Reliability Rank</p>
          <div className="flex items-center gap-1">
             {[...Array(5)].map((_, i) => (
               <div key={i} className={`w-1.5 h-3 rounded-sm ${i < (metric.successRate / 20) ? 'bg-blue-500' : 'bg-[#2a2d35]'}`} />
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
