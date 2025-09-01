import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from './useAuth';
import { type PeriodOption } from '@/contexts/PeriodContext';

// Função auxiliar para contar domingos entre duas datas (incluindo ambas)
function contarDomingos(dataInicio: Date, dataFim: Date): number {
  let count = 0;
  const current = new Date(dataInicio);
  
  while (current <= dataFim) {
    if (current.getDay() === 0) { // Domingo = 0
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

export interface MetricData {
  title: string;
  todaySales: string;
  periodSales: string;
  target: string;
  dailyTarget: string;
  missingToday: string;
  remainingDays: number;
  category: 'geral' | 'rentavel' | 'perfumaria' | 'conveniencia' | 'goodlife';
  status: 'pendente' | 'atingido' | 'acima';
}

export function useDashboardData(user: User | null, selectedPeriod?: PeriodOption | null, selectedLojaId?: number | null) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !selectedPeriod) {
      setLoading(false);
      return;
    }

    // Usar selectedLojaId se fornecido, senão usar loja do usuário
    const currentLojaId = selectedLojaId || user.loja_id;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Buscar metas da loja atual para o período selecionado
        const { data: metasLoja } = await supabase
          .from('metas_loja')
          .select('*, metas_loja_categorias(*)')
          .eq('loja_id', currentLojaId)
          .eq('periodo_meta_id', selectedPeriod.id);

        // Buscar vendas da loja atual no período selecionado
        const { data: vendasLoja } = await supabase
          .from('vendas_loja')
          .select('*')
          .eq('loja_id', currentLojaId)
          .gte('data_venda', selectedPeriod.startDate.toISOString().split('T')[0])
          .lte('data_venda', selectedPeriod.endDate.toISOString().split('T')[0]);

        // Buscar vendas até ontem (para cálculo da meta diária)
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = ontem.toISOString().split('T')[0];
        const { data: vendasAteOntem } = await supabase
          .from('vendas_loja')
          .select('*')
          .eq('loja_id', currentLojaId)
          .gte('data_venda', selectedPeriod.startDate.toISOString().split('T')[0])
          .lte('data_venda', ontemStr);

        // Buscar vendas do dia atual
        const hoje = new Date();
        const hojeStr = hoje.toISOString().split('T')[0];
        const { data: vendasHoje } = await supabase
          .from('vendas_loja')
          .select('*')
          .eq('loja_id', currentLojaId)
          .eq('data_venda', hojeStr);

        // Buscar informações da loja para verificar região
        const { data: lojaInfo } = await supabase
          .from('lojas')
          .select('regiao')
          .eq('id', currentLojaId)
          .single();

        // Calcular dias restantes no período (incluindo hoje)
        let diasRestantes = Math.max(1, Math.ceil((selectedPeriod.endDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        // Se a loja é da região 'centro', descontar domingos dos dias restantes
        if (lojaInfo?.regiao === 'centro') {
          const domingosRestantes = contarDomingos(hoje, selectedPeriod.endDate);
          diasRestantes = Math.max(1, diasRestantes - domingosRestantes);
        }

        // Processar dados para métricas
        const processedMetrics: MetricData[] = [];

        // Categorias de metas para loja (conforme esclarecimento)
        const categorias = [
          { id: 'geral', name: 'Geral' },
          { id: 'r_mais', name: 'Rentáveis' },
          { id: 'perfumaria_r_mais', name: 'Perfumaria R+' },
          { id: 'conveniencia_r_mais', name: 'Conveniência R+' },
          { id: 'saude', name: 'GoodLife' }
        ];

        for (const categoria of categorias) {
          let metaValor = 0;
          
          if (categoria.id === 'geral') {
            // Para categoria geral, usar meta_valor_total da metas_loja
            metaValor = metasLoja?.[0]?.meta_valor_total || 0;
          } else {
            // Para outras categorias, buscar na metas_loja_categorias
            const metaCategoria = metasLoja?.[0]?.metas_loja_categorias?.find(
              (m: any) => m.categoria === categoria.id
            );
            metaValor = metaCategoria?.meta_valor || 0;
          }

          // Filtrar vendas da categoria para o período
          let vendasCategoria;
          if (categoria.id === 'r_mais') {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === 'r_mais' || v.categoria === 'rentaveis20' || v.categoria === 'rentaveis25'
            ) || [];
          } else if (categoria.id === 'conveniencia_r_mais') {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === 'conveniencia_r_mais' || v.categoria === 'conveniencia' || v.categoria === 'brinquedo'
            ) || [];
          } else if (categoria.id === 'saude') {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === 'saude' || v.categoria === 'goodlife'
            ) || [];
          } else {
            vendasCategoria = vendasLoja?.filter(
              (v: any) => v.categoria === categoria.id
            ) || [];
          }

          // Filtrar vendas da categoria até ontem (para cálculo da meta diária)
          let vendasCategoriaAteOntem;
          if (categoria.id === 'r_mais') {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === 'r_mais' || v.categoria === 'rentaveis20' || v.categoria === 'rentaveis25'
            ) || [];
          } else if (categoria.id === 'conveniencia_r_mais') {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === 'conveniencia_r_mais' || v.categoria === 'conveniencia' || v.categoria === 'brinquedo'
            ) || [];
          } else if (categoria.id === 'saude') {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === 'saude' || v.categoria === 'goodlife'
            ) || [];
          } else {
            vendasCategoriaAteOntem = vendasAteOntem?.filter(
              (v: any) => v.categoria === categoria.id
            ) || [];
          }

          // Filtrar vendas da categoria para hoje
          let vendasCategoriaHoje;
          if (categoria.id === 'r_mais') {
            vendasCategoriaHoje = vendasHoje?.filter(
              (v: any) => v.categoria === 'r_mais' || v.categoria === 'rentaveis20' || v.categoria === 'rentaveis25'
            ) || [];
          } else if (categoria.id === 'conveniencia_r_mais') {
            vendasCategoriaHoje = vendasHoje?.filter(
              (v: any) => v.categoria === 'conveniencia_r_mais' || v.categoria === 'conveniencia' || v.categoria === 'brinquedo'
            ) || [];
          } else if (categoria.id === 'saude') {
            vendasCategoriaHoje = vendasHoje?.filter(
              (v: any) => v.categoria === 'saude' || v.categoria === 'goodlife'
            ) || [];
          } else {
            vendasCategoriaHoje = vendasHoje?.filter(
              (v: any) => v.categoria === categoria.id
            ) || [];
          }
          
          const totalVendidoPeriodo = vendasCategoria.reduce((sum: number, v: any) => sum + Number(v.valor_venda), 0);
          const totalVendidoAteOntem = vendasCategoriaAteOntem.reduce((sum: number, v: any) => sum + Number(v.valor_venda), 0);
          const totalVendidoHoje = vendasCategoriaHoje.reduce((sum: number, v: any) => sum + Number(v.valor_venda), 0);
          
          // Calcular meta diária baseada no que faltava até ontem (não incluindo vendas de hoje)
          const faltanteAteOntem = Math.max(0, metaValor - totalVendidoAteOntem);
          const metaDiaria = faltanteAteOntem > 0 ? faltanteAteOntem / diasRestantes : 0;
          
          // Calcular quanto falta hoje (meta diária - vendido hoje)
          const faltanteHoje = Math.max(0, metaDiaria - totalVendidoHoje);
          
          let status: 'pendente' | 'atingido' | 'acima' = 'pendente';
          if (totalVendidoHoje >= metaDiaria && metaDiaria > 0) {
            status = totalVendidoHoje > metaDiaria ? 'acima' : 'atingido';
          }

          processedMetrics.push({
            title: categoria.name,
            todaySales: `R$ ${totalVendidoHoje.toFixed(2).replace('.', ',')}`,
            periodSales: `R$ ${totalVendidoPeriodo.toFixed(2).replace('.', ',')}`,
            target: `R$ ${metaValor.toFixed(2).replace('.', ',')}`,
            dailyTarget: `R$ ${metaDiaria.toFixed(2).replace('.', ',')}`,
            missingToday: `R$ ${faltanteHoje.toFixed(2).replace('.', ',')}`,
            remainingDays: diasRestantes,
            category: categoria.id === 'r_mais' ? 'rentavel' : 
                     categoria.id === 'perfumaria_r_mais' ? 'perfumaria' :
                     categoria.id === 'conveniencia_r_mais' ? 'conveniencia' :
                     categoria.id === 'saude' ? 'goodlife' : 'geral',
            status
          });
        }

        setMetrics(processedMetrics);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, selectedPeriod, selectedLojaId]);

  return { metrics, loading };
}