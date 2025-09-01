import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { getNomeCategoria, getIconeCategoria, getClasseCorCategoria } from "@/utils/categories";
import { TrendingUp, Target, Calendar, AlertTriangle } from "lucide-react";

interface MetricCardProps {
  title: string;
  todaySales: string;
  periodSales: string;
  target: string;
  dailyTarget: string;
  missingToday: string;
  remainingDays: number;
  category: 'geral' | 'rentavel' | 'perfumaria' | 'conveniencia' | 'goodlife';
  status: 'pendente' | 'atingido' | 'acima';
  className?: string;
}

const categoryStyles = {
  geral: "border-l-category-geral",
  rentavel: "border-l-category-rentavel", 
  perfumaria: "border-l-category-perfumaria",
  conveniencia: "border-l-category-conveniencia",
  goodlife: "border-l-category-goodlife"
};

export function MetricCard({ 
  title, 
  todaySales,
  periodSales,
  target, 
  dailyTarget,
  missingToday,
  remainingDays,
  category, 
  status = 'pendente',
  className
}: MetricCardProps) {
  // Mapear categorias locais para categorias padrão
  const categoryMap: Record<string, string> = {
    'geral': 'geral',
    'rentavel': 'r_mais',
    'perfumaria': 'perfumaria_r_mais',
    'conveniencia': 'conveniencia_r_mais',
    'goodlife': 'goodlife'
  };
  
  const mappedCategory = categoryMap[category] || category;
  const iconColor = getClasseCorCategoria(mappedCategory);
  
  return (
    <Card className={cn(
      "overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background to-muted/30",
      categoryStyles[category],
      className
    )}>
      <CardHeader className="pb-3 min-h-[88px] flex items-center">
        <div className="flex items-start justify-between w-full">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0",
              `bg-${category === 'geral' ? 'blue' : category === 'rentavel' ? 'red' : category === 'perfumaria' ? 'purple' : category === 'conveniencia' ? 'orange' : 'green'}-100`
            )}>
              <i className={`${getIconeCategoria(mappedCategory)} text-xl ${iconColor}`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2 min-h-[2.5rem] flex items-center">{title}</h3>
              <p className="text-sm text-muted-foreground">Categoria</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={status} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Venda do Dia - Destaque Principal */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Venda de Hoje</span>
          </div>
          <p className="text-3xl font-bold text-primary tracking-tight">{todaySales}</p>
        </div>

        {/* Meta Diária */}
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Meta Diária</span>
            </div>
            <span className="text-lg font-bold text-blue-800">{dailyTarget}</span>
          </div>
        </div>

        {/* Falta Hoje */}
        {missingToday !== 'R$ 0,00' && (
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Falta Hoje</span>
              </div>
              <span className="text-lg font-bold text-amber-800">{missingToday}</span>
            </div>
          </div>
        )}

        {/* Informações Secundárias */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-muted/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Período Total</p>
            <p className="text-sm font-semibold text-foreground">{periodSales}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Meta Período</p>
            <p className="text-sm font-semibold text-foreground">{target}</p>
          </div>
        </div>

        {/* Dias Restantes */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg py-2">
          <Calendar className="w-3 h-3" />
          <span>{remainingDays} dias restantes no período</span>
        </div>
      </CardContent>
    </Card>
  );
}