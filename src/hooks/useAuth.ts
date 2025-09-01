import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import bcrypt from 'bcryptjs';

export interface User {
  id: number;
  nome: string;
  login: string;
  tipo: string;
  loja_id: number;
  permissao: number;
  status: string;
  cpf?: string;
  matricula?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (loginInput: string, senha: string) => {
    console.log('🚀 Iniciando login para:', loginInput);
    try {
      // Primeiro, buscar o usuário pelo login
      const { data: userRecord, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('login', loginInput)
        .maybeSingle();

      if (userError) throw userError;
      
      if (!userRecord) {
        console.log('❌ Usuário não encontrado');
        return { success: false, error: 'Usuário ou senha inválidos' };
      }

      // Verificar se a senha coincide (senha padrão ou bcrypt)
      // Se a senha no banco começar com $2b$, $2a$, etc., é bcrypt
      const isBcryptHash = userRecord.senha && userRecord.senha.startsWith('$2');
      
      let senhaValida = false;
      
      if (isBcryptHash) {
        // Usar bcrypt para validar senhas hash
        senhaValida = await bcrypt.compare(senha, userRecord.senha);
      } else {
        // Senha padrão em texto simples
        senhaValida = userRecord.senha === senha;
      }

      if (!senhaValida) {
        console.log('❌ Senha inválida');
        return { success: false, error: 'Usuário ou senha inválidos' };
      }
      
      // Mapear os dados do banco para o tipo User
      const userData: User = {
        id: userRecord.id,
        nome: userRecord.nome,
        login: userRecord.login,
        tipo: userRecord.tipo,
        loja_id: userRecord.loja_id,
        permissao: Number(userRecord.permissao) || 0,
        status: 'ativo',
        cpf: userRecord.CPF || null, // Nota: banco usa 'CPF' maiúsculo
        matricula: userRecord.matricula
      };
      
      console.log('✅ Login bem-sucedido, definindo usuário:', userData.nome);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch (error) {
      console.log('❌ Erro no login:', error);
      return { success: false, error: 'Usuário ou senha inválidos' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Usar window.location para garantir redirecionamento completo
    window.location.href = '/login';
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Erro ao carregar usuário do localStorage:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  return { user, login, logout, loading };
}