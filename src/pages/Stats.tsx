import { useGetStats } from "@workspace/api-client-react";
import { BarChart2, Zap, Bookmark, Trophy } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";
import { PageHero, ROUTE_THEMES } from "@/components/layout/PageHero";
import { LabLayout } from "@/components/layout/WorkspaceLayouts";

export default function Stats() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading || !stats) {
    return (
      <LabLayout className="space-y-8">
        <div className="h-10 w-48 bg-card animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-card border border-border rounded-xl animate-pulse mt-8" />
      </LabLayout>
    );
  }

  const chartData = Object.entries(stats.categoryCounts).map(([name, value]) => ({
    name,
    value
  })).sort((a, b) => b.value - a.value);

  const COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316'];

  return (
    <LabLayout>
      <PageHero
        ambientVariant="cockpit"
        eyebrow="Analytics"
        title="Your creator stats"
        subtitle="Track your content generation usage at a glance."
        icon={BarChart2}
        accent={ROUTE_THEMES.stats.accent}
        glow={ROUTE_THEMES.stats.glow}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Generations" 
          value={stats.totalGenerations} 
          icon={<Zap className="w-6 h-6 text-primary" />} 
          delay={0}
        />
        <StatCard 
          title="Items Saved" 
          value={stats.totalSaved} 
          icon={<Bookmark className="w-6 h-6 text-accent" />} 
          delay={0.1}
        />
        <StatCard 
          title="Top Category" 
          value={stats.topCategory || "None"} 
          icon={<Trophy className="w-6 h-6 text-yellow-500" />} 
          delay={0.2}
        />
      </div>

      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-6">Generations by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </LabLayout>
  );
}

function StatCard({ title, value, icon, delay }: { title: string, value: string | number, icon: React.ReactNode, delay: number }) {
  return (
    <div 
      className="bg-card border border-border rounded-xl p-6 flex items-center gap-4 animate-in slide-in-from-bottom-4 fade-in"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
    >
      <div className="w-12 h-12 rounded-lg bg-foreground/5 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      </div>
    </div>
  );
}
