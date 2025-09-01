import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Store, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Loja {
  id: number;
  nome: string;
  numero: string;
  regiao: string;
}

interface StoreSelectorProps {
  selectedLojaId: number | null;
  onLojaChange: (lojaId: number | null) => void;
  userLojaId: number;
}

export function StoreSelector({ selectedLojaId, onLojaChange, userLojaId }: StoreSelectorProps) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLojas();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('id, nome, numero, regiao')
        .neq('numero', '00')
        .neq('id', 99)
        .order('numero');

      if (error) throw error;
      
      // Sort by numero (converted to number for proper sorting)
      const sortedLojas = (data || []).sort((a, b) => {
        const numA = parseInt(a.numero) || 0;
        const numB = parseInt(b.numero) || 0;
        return numA - numB;
      });
      
      setLojas(sortedLojas);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedLoja = selectedLojaId 
    ? lojas.find(loja => loja.id === selectedLojaId)
    : lojas.find(loja => loja.id === userLojaId);

  const filteredLojas = lojas.filter(loja => {
    const searchLower = searchTerm.toLowerCase();
    return (
      loja.nome.toLowerCase().includes(searchLower) ||
      loja.numero.toLowerCase().includes(searchLower)
    );
  });

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };

  const handleLojaSelect = (loja: Loja | null) => {
    if (loja === null) {
      // Selecionar "Todas as Lojas"
      onLojaChange(null);
    } else {
      onLojaChange(loja.id === userLojaId ? null : loja.id);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span className="text-sm text-muted-foreground">Carregando lojas...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={handleToggle}
        variant="outline"
        className={cn(
          "relative overflow-hidden transition-all duration-300 ease-out",
          "bg-gradient-to-r from-success/10 to-success/5 hover:from-success/20 hover:to-success/10",
          "border-success/30 hover:border-success/50 text-success hover:text-success",
          "shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
        )}
      >
        <Store className="w-4 h-4 mr-2" />
        <span className="font-medium">
          {selectedLoja ? `${selectedLoja.numero} - ${selectedLoja.nome.toUpperCase()}` : 'Todas as Lojas'}
        </span>
        <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-popover border border-border rounded-lg shadow-xl z-50 animate-in slide-in-from-top-2">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nome ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Opção "Todas as Lojas" */}
            <div className="p-2">
              <button
                onClick={() => handleLojaSelect(null)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-accent mb-2",
                  selectedLojaId === null && !selectedLoja && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Todas as Lojas</div>
                    <div className="text-sm text-muted-foreground">Ver dados de todas as lojas</div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Global
                  </Badge>
                </div>
              </button>
            </div>

            {/* Opção "Minha Loja" */}
            <div className="p-2">
              <button
                onClick={() => handleLojaSelect(lojas.find(l => l.id === userLojaId)!)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-accent",
                  selectedLojaId === null && selectedLoja && "bg-primary/10 text-primary font-medium"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedLoja?.numero} - {selectedLoja?.nome.toUpperCase()}</div>
                    <div className="text-sm text-muted-foreground">Minha Loja</div>
                  </div>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Principal
                  </Badge>
                </div>
              </button>
            </div>

            {/* Separador */}
            <div className="px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border">
              OUTRAS LOJAS
            </div>

            {/* Lojas */}
            <div className="p-2">
              {filteredLojas.map((loja) => (
                <button
                  key={loja.id}
                  onClick={() => handleLojaSelect(loja)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md transition-colors hover:bg-accent mb-1",
                    selectedLojaId === loja.id && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{loja.numero} - {loja.nome.toUpperCase()}</div>
                    </div>
                    {loja.id === userLojaId && (
                      <Badge variant="outline" className="text-xs">
                        Sua loja
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {filteredLojas.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma loja encontrada</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}