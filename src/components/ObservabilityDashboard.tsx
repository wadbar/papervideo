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
  Search,
  Signal,
  CheckCircle2,
  HardDrive,
  Workflow,
  Eye,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjectStore } from '../core/store/useProjectStore';
import { useSettingsStore } from '../core/store/useSettingsStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const CustomChartDot = (props: any) => {
  const { cx, cy, payload, stroke, dataKey } = props;
  
  const isJump = dataKey === 'brightness' ? payload.brightnessJump : payload.contrastJump;

  if (isJump) {
    return (
      <circle cx={cx} cy={cy} r={6} fill="var(--color-error)" stroke="var(--color-surface)" strokeWidth={2} className="animate-pulse" />
    );
  }
  
  return (
    <circle cx={cx} cy={cy} r={4} fill="var(--color-surface)" stroke={stroke} strokeWidth={2} />
  );
};

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
  const [totalRequests, setTotalRequests] = useState(0);

  const activeProject = useProjectStore(state => {
    return state.projects.find(p => p.id === state.activeProjectId);
  });
  const autoSync = useSettingsStore(state => state.systemSettings.autoSync);

  // Analyze consecutive scenes for visual style transitions
  const consecutiveJumps = React.useMemo(() => {
    if (!activeProject || !activeProject.scenes || activeProject.scenes.length < 2) {
      return [];
    }

    const jumps = [];
    const scenes = activeProject.scenes;

    for (let i = 0; i < scenes.length - 1; i++) {
      const current = scenes[i];
      const next = scenes[i + 1];

      const currentGrade = current.postProcessing?.colorGrade || 'Original';
      const nextGrade = next.postProcessing?.colorGrade || 'Original';

      const currentBrightness = current.postProcessing?.brightness ?? 100;
      const nextBrightness = next.postProcessing?.brightness ?? 100;

      const currentContrast = current.postProcessing?.contrast ?? 100;
      const nextContrast = next.postProcessing?.contrast ?? 100;

      const brightnessDelta = nextBrightness - currentBrightness;
      const contrastDelta = nextContrast - currentContrast;

      const hasGradeChange = currentGrade !== nextGrade;
      const hasBrightnessJump = Math.abs(brightnessDelta) > 15;
      const hasContrastJump = Math.abs(contrastDelta) > 15;

      const isStable = !hasGradeChange && !hasBrightnessJump && !hasContrastJump;

      jumps.push({
        fromIdx: i,
        toIdx: i + 1,
        fromId: current.id,
        toId: next.id,
        currentGrade,
        nextGrade,
        currentBrightness,
        nextBrightness,
        brightnessDelta,
        contrastDelta,
        hasGradeChange,
        hasBrightnessJump,
        hasContrastJump,
        isStable
      });
    }

    return jumps;
  }, [activeProject]);

  const chartData = React.useMemo(() => {
    if (!activeProject || !activeProject.scenes) return [];
    
    return activeProject.scenes.map((scene, idx) => {
      const brightness = scene.postProcessing?.brightness ?? 100;
      const contrast = scene.postProcessing?.contrast ?? 100;
      
      let brightnessJump = false;
      let contrastJump = false;
      if (idx > 0) {
        const prev = activeProject.scenes[idx - 1];
        const prevB = prev.postProcessing?.brightness ?? 100;
        const prevC = prev.postProcessing?.contrast ?? 100;
        if (Math.abs(brightness - prevB) > 15) brightnessJump = true;
        if (Math.abs(contrast - prevC) > 15) contrastJump = true;
      }
      
      return {
        name: `N-${idx + 1}`,
        brightness,
        contrast,
        brightnessJump,
        contrastJump
      };
    });
  }, [activeProject]);

  const fetchMetrics = async () => {
    setIsRefreshing(true);
    try {
      const resp = await fetch('/api/ai/metrics', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await resp.json();
      setMetrics(data);
      const total = data.reduce((acc: number, curr: any) => acc + (curr.successCount || 0) + (curr.failures || 0), 0);
      setTotalRequests(total > 0 ? total : 0);
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
    <div className="flex-1 p-6 sm:p-12 overflow-y-auto custom-scrollbar bg-surface select-none">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
                  <ShieldCheck className="text-on-primary w-8 h-8" />
               </div>
               <h1 className="text-4xl font-black tracking-tight text-on-surface">Telemetry_Nexus</h1>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
               <p className="text-on-surface-variant font-bold text-sm tracking-wide uppercase opacity-60 flex items-center gap-2">
                  <Signal className="w-4 h-4 text-primary" />
                  Real-time Monitoring of Distributed Neural Protocols
               </p>
               <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${autoSync ? 'bg-tertiary/10 border-tertiary/30 text-tertiary' : 'bg-surface-variant/20 border-outline-variant/30 text-on-surface-variant opacity-60'}`}>
                  <Cloud className="w-3 h-3" />
                  <span>{autoSync ? 'Firestore Sync: Active' : 'Firestore Sync: Disabled'}</span>
               </div>
            </div>
          </div>
          <button 
            onClick={fetchMetrics}
            disabled={isRefreshing}
            className="group flex items-center gap-3 px-8 py-4 bg-surface-variant/30 border border-outline-variant/30 rounded-2xl hover:border-primary/40 transition-all active:scale-95 text-[10px] font-black uppercase tracking-[0.2em] text-primary disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
            Sync Matrix
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={<Zap className="text-primary" />} 
            label="Avg Latency" 
            value={`${Math.round(metrics.reduce((acc, m) => acc + m.avgLatency, 0) / (metrics.length || 1))}ms`} 
            sub="Global response bandwidth"
            accent="primary"
          />
          <StatCard 
            icon={<CheckCircle2 className="text-tertiary" />} 
            label="Resilience Factor" 
            value="99.9%" 
            sub="Success delivery threshold"
            accent="tertiary"
          />
          <StatCard 
            icon={<Workflow className="text-secondary" />} 
            label="Active Circuits" 
            value={`${metrics.filter(m => m.status === 'CLOSED').length}/${metrics.length}`} 
            sub="Neural health nodes"
            accent="secondary"
          />
          <StatCard 
            icon={<HardDrive className="text-error" />} 
            label="Total Compute" 
            value={`${totalRequests}`} 
            sub="Aggregate inference count"
            accent="error"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between ml-1">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Visual Styling Telemetry</h2>
                <div className="h-px flex-1 bg-outline-variant/20 mx-6" />
            </div>
            <div className="bg-surface border border-outline-variant/30 rounded-[2.5rem] p-8 h-[360px] relative">
               {chartData.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.3} vertical={false} />
                       <XAxis dataKey="name" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
                       <YAxis domain={['auto', 'auto']} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={false} dx={-10} />
                       <RechartsTooltip 
                         contentStyle={{ backgroundColor: 'var(--color-surface-container-high)', borderRadius: '1rem', border: '1px solid var(--color-outline-variant)', color: 'var(--color-on-surface)' }}
                         itemStyle={{ fontWeight: 700, fontSize: 12 }}
                         labelStyle={{ fontWeight: 900, marginBottom: '0.5rem', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}
                       />
                       <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}/>
                       <Line type="monotone" dataKey="brightness" stroke="var(--color-primary)" strokeWidth={3} dot={CustomChartDot} activeDot={{ r: 6 }} />
                       <Line type="monotone" dataKey="contrast" stroke="var(--color-tertiary)" strokeWidth={3} dot={CustomChartDot} activeDot={{ r: 6 }} />
                     </LineChart>
                   </ResponsiveContainer>
               ) : (
                   <div className="py-12 text-center flex flex-col items-center justify-center h-full gap-3">
                       <Eye className="w-8 h-8 text-on-surface-variant/20 animate-pulse" />
                       <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest opacity-40 italic">No styling telemetry available</p>
                   </div>
               )}
            </div>
          </div>
          
          {/* Main Provider Performance */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between ml-1">
               <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Infrastructure Performance Matrix</h2>
               <div className="h-px flex-1 bg-outline-variant/20 mx-6" />
            </div>
            <div className="space-y-4">
              {metrics.map((metric, idx) => (
                <ProviderMetricRow key={idx} metric={metric} />
              ))}
            </div>
          </div>

          {/* Incident Log & Insights */}
          <div className="space-y-8">
            <div className="bg-surface-variant/10 rounded-[2.5rem] p-8 border border-outline-variant/30 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-error/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-2 bg-error/10 rounded-xl text-error">
                    <AlertCircle className="w-5 h-5 shadow-sm" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-error">Critical Ops Log</h3>
               </div>
               
               <div className="space-y-6">
                 {[...metrics].filter(m => m.lastFail).sort((a,b) => (b.lastFail || 0) - (a.lastFail || 0)).slice(0, 5).map((m, i) => (
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={`m-${i}`} 
                    className="flex gap-5 group/item"
                   >
                      <div className="w-1 bg-error/20 rounded-full transition-all group-hover/item:bg-error/40" />
                      <div className="flex-1 space-y-1">
                        <p className="text-on-surface font-black text-[10px] tracking-tight uppercase group-hover/item:text-error transition-colors">{m.provider} - STATE_CHANGE: [{m.status}]</p>
                        <p className="text-[9px] font-mono font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">{new Date(m.lastFail!).toLocaleTimeString()} - INFRA_INTERRUPT</p>
                      </div>
                   </motion.div>
                 ))}
                 
                 {consecutiveJumps.filter(j => !j.isStable).slice(0, 3).map((jump, idx) => (
                   <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    key={`j-${idx}`} 
                    className="flex gap-5 group/item"
                   >
                      <div className="w-1 bg-primary/20 rounded-full transition-all group-hover/item:bg-primary/40" />
                      <div className="flex-1 space-y-1">
                        <p className="text-on-surface font-black text-[10px] tracking-tight uppercase group-hover/item:text-primary transition-colors">VISUAL CONSISTENCY - Style Drift</p>
                        <p className="text-[9px] font-mono font-bold text-on-surface-variant opacity-40 uppercase tracking-widest gap-2 flex items-center">
                           <span>SCENE {jump.fromIdx + 1} ➔ {jump.toIdx + 1}</span>
                           <span>| {jump.hasGradeChange ? 'Grade Shift' : 'Lighting Jump'}</span>
                        </p>
                      </div>
                   </motion.div>
                 ))}

                 {!metrics.some(m => m.lastFail) && !consecutiveJumps.some(j => !j.isStable) && (
                   <div className="py-8 text-center flex flex-col items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-on-surface-variant/10" />
                      <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest opacity-30 italic">No stability incidents reported</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="bg-surface-variant/10 rounded-[2.5rem] p-8 border border-outline-variant/30 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
               <div className="flex items-center gap-4 mb-6">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Eye className="w-5 h-5 shadow-sm" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface">Visual Consistency Log</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest opacity-60">Symmetry Audit & Style Drift</p>
                  </div>
               </div>

               <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                 {consecutiveJumps.length === 0 ? (
                   <div className="py-8 text-center flex flex-col items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-on-surface-variant/10 animate-pulse" />
                      <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest opacity-40 italic">No multi-scene transitions to audit</p>
                      <span className="text-[9px] text-on-surface-variant/50 max-w-[200px] leading-relaxed">Ensure your project has 2 or more scenes with styling customized to check style drift.</span>
                   </div>
                 ) : (
                   consecutiveJumps.map((jump, idx) => (
                     <motion.div 
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: idx * 0.05 }}
                       key={idx}
                       className={`p-4 rounded-3xl border transition-all ${jump.isStable ? 'bg-surface/50 border-outline-variant/15 hover:border-outline-variant/40' : 'bg-primary/5 border-primary/20 hover:border-primary/40'} space-y-2`}
                     >
                       <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-black">
                         <span className="text-on-surface">NODE {jump.fromIdx + 1} ➔ NODE {jump.toIdx + 1}</span>
                         <span className={`px-2.5 py-1 rounded-full ${jump.isStable ? 'text-tertiary bg-tertiary/10 border border-tertiary/20' : 'text-primary bg-primary/10 border border-primary/25'}`}>
                           {jump.isStable ? 'STABLE_AXIS' : 'STYLE_DRIFT_ALERT'}
                         </span>
                       </div>

                       <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-on-surface-variant leading-relaxed">
                         <div className="space-y-0.5">
                           <span className="text-[8px] uppercase tracking-wider block opacity-50 font-bold">Color Grade Shift</span>
                           <span className={jump.hasGradeChange ? "text-primary font-bold" : "text-on-surface-variant"}>
                             {jump.hasGradeChange ? `${jump.currentGrade} ➔ ${jump.nextGrade}` : `Consistent (${jump.currentGrade})`}
                           </span>
                         </div>
                         <div className="space-y-0.5">
                           <span className="text-[8px] uppercase tracking-wider block opacity-50 font-bold">Lighting Jump</span>
                           <span className={jump.hasBrightnessJump ? "text-primary font-bold" : "text-on-surface-variant"}>
                             {jump.hasBrightnessJump 
                               ? `Brightness: ${jump.brightnessDelta > 0 ? '+' : ''}${jump.brightnessDelta}%` 
                               : `Low Delta (${jump.brightnessDelta > 0 ? '+' : ''}${jump.brightnessDelta}%)`}
                           </span>
                         </div>
                       </div>

                       {!jump.isStable && (
                         <div className="text-[8px] font-black text-primary uppercase tracking-widest pt-1 flex items-center gap-1.5 border-t border-primary/10 mt-1">
                           <AlertCircle className="w-3 h-3" /> 
                           <span>Potential visual jump detected!</span>
                         </div>
                       )}
                     </motion.div>
                   ))
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode, label: string, value: string, sub: string, accent: 'primary' | 'secondary' | 'tertiary' | 'error' }) {
  const accentColors = {
    primary: 'border-primary/20 hover:border-primary/60 bg-primary/2',
    secondary: 'border-secondary/20 hover:border-secondary/60 bg-secondary/2',
    tertiary: 'border-tertiary/20 hover:border-tertiary/60 bg-tertiary/2',
    error: 'border-error/20 hover:border-error/60 bg-error/2',
  };

  return (
    <div className={`m3-card p-10 rounded-[2.5rem] border transition-all duration-700 group relative overflow-hidden ${accentColors[accent]}`}>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-surface-variant/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm border border-outline-variant/30">
            {icon}
          </div>
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{label}</span>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-black tracking-tight text-on-surface group-hover:translate-x-2 transition-transform duration-500">{value}</p>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest opacity-40">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function ProviderMetricRow({ metric }: { metric: Metric }) {
  const getProviderIcon = (name: string) => {
    if (name === 'ollama') return <Server className="text-tertiary" />;
    if (name === 'gemini') return <Cpu className="text-primary" />;
    if (name === 'nvidia') return <Globe className="text-secondary" />;
    return <Search className="text-on-surface-variant" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'CLOSED') return 'text-tertiary m3-badge-success';
    if (status === 'HALF_OPEN') return 'text-error m3-badge-warning'; // Usually warning but let's stick to theme
    return 'text-error m3-badge-error';
  };

  return (
    <motion.div 
      layout
      className="m3-card p-8 flex flex-col md:flex-row items-center gap-12 bg-surface hover:bg-surface-variant/10 border-outline-variant/30 transition-all duration-500 rounded-[2.5rem] border group relative overflow-hidden group/row"
    >
      <div className={`absolute left-0 top-0 w-1.5 h-full transition-all duration-500 ${metric.status === 'CLOSED' ? 'bg-tertiary' : 'bg-error'}`} />

      <div className="flex flex-col items-center md:items-start min-w-[200px] shrink-0 gap-4">
        <div className="relative group/icon">
          <div className="w-16 h-16 rounded-[1.5rem] bg-surface-variant/20 flex items-center justify-center border border-outline-variant/30 group-hover/icon:scale-110 transition-transform duration-500">
            {getProviderIcon(metric.provider)}
          </div>
          <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border-4 border-surface shadow-lg ${metric.status === 'CLOSED' ? 'bg-tertiary animate-pulse' : metric.status === 'HALF_OPEN' ? 'bg-error opacity-60' : 'bg-error'}`} />
        </div>
        <div className="text-center md:text-left space-y-1">
          <h3 className="font-black text-xl tracking-tight text-on-surface uppercase">{metric.provider}</h3>
          <span className={`text-[9px] font-black px-4 py-1.5 rounded-full block text-center uppercase tracking-widest ${getStatusColor(metric.status)}`}>
            STATE: {metric.status}
          </span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-10 w-full relative">
        <div className="space-y-3">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Avg Latency</p>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary opacity-40 group-hover/row:opacity-100 transition-opacity" />
            <span className="text-lg font-mono font-black text-on-surface tracking-tighter">{Math.round(metric.avgLatency)}ms</span>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">SLA Accuracy</p>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-tertiary opacity-40 group-hover/row:opacity-100 transition-opacity" />
            <span className="text-lg font-mono font-black text-on-surface tracking-tighter">{metric.successRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Neural Faults</p>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error opacity-40 group-hover/row:opacity-100 transition-opacity" />
            <span className="text-lg font-mono font-black text-on-surface tracking-tighter">{metric.failures}</span>
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Reliability Rank</p>
          <div className="flex items-center gap-1.5 h-6">
             {[...Array(5)].map((_, i) => (
               <motion.div 
                key={i} 
                initial={{ height: 4 }}
                animate={{ height: i < (metric.successRate / 20) ? 16 : 4 }}
                className={`w-2.5 rounded-full ${i < (metric.successRate / 20) ? 'bg-primary shadow-[0_0_10px_rgba(var(--color-primary-rgb),0.3)]' : 'bg-outline-variant/30'}`} 
               />
             ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
