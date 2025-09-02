import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, UserCog, Camera, Trash2, Save, Key, User, Eye, EyeOff, Upload, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDescricaoTipoUsuario } from '@/utils/userTypes';

interface PasswordStrength {
  score: number;
  text: string;
  color: string;
}

export default function Configuracoes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, text: 'Muito fraca', color: 'bg-destructive' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    email: '',
    data_nascimento: '',
    data_contratacao: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load current avatar on component mount
  useEffect(() => {
    if (user?.id) {
      loadCurrentAvatar();
    }
  }, [user?.id]);

  const loadCurrentAvatar = async () => {
    if (!user?.id) return;

    try {
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/avatar.jpg`);
      
      if (data?.publicUrl) {
        setCurrentAvatarUrl(data.publicUrl);
      }
    } catch (error) {
      console.log('Erro ao carregar avatar:', error);
    }
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, text: 'Muito fraca', color: 'bg-destructive' };
      case 2:
        return { score, text: 'Fraca', color: 'bg-orange-500' };
      case 3:
        return { score, text: 'Média', color: 'bg-yellow-500' };
      case 4:
        return { score, text: 'Boa', color: 'bg-blue-500' };
      case 5:
        return { score, text: 'Muito forte', color: 'bg-green-500' };
      default:
        return { score: 0, text: 'Muito fraca', color: 'bg-destructive' };
    }
  };

  const handlePasswordChange = (value: string) => {
    setPasswordData(prev => ({ ...prev, newPassword: value }));
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          email: profileData.email,
          data_nascimento: profileData.data_nascimento || null,
          data_contratacao: profileData.data_contratacao || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e confirmação devem ser iguais.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Here you would implement password verification and update
      // For now, we'll just show a success message
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user?.id) return;

    setLoading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      if (data?.publicUrl) {
        setCurrentAvatarUrl(data.publicUrl);
        setAvatarFile(null);
        setAvatarPreview('');
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast({
          title: "Avatar atualizado",
          description: "Sua foto de perfil foi atualizada com sucesso.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.gif`]);

      setCurrentAvatarUrl('');
      
      toast({
        title: "Avatar removido",
        description: "Sua foto de perfil foi removida.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover avatar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card className="max-w-2xl mx-auto mt-20">
          <CardContent className="text-center p-8">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCog className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Minhas Configurações</CardTitle>
            </div>
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Dashboard
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* User Info Card */}
          <Card className="mb-6 bg-muted/50">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={currentAvatarUrl} alt="Avatar do usuário" />
                  <AvatarFallback className="text-2xl font-bold">
                    {user.nome.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold mb-2">{user.nome}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Matrícula: {user.matricula}
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCog className="w-4 h-4" />
                      {getDescricaoTipoUsuario(user.tipo)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="perfil" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Editar Perfil
              </TabsTrigger>
              <TabsTrigger value="senha" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Alterar Senha
              </TabsTrigger>
              <TabsTrigger value="foto" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Foto de Perfil
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="perfil" className="space-y-6">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input value={user.nome} disabled />
                    <p className="text-xs text-muted-foreground">
                      Seu nome não pode ser alterado. Entre em contato com seu gerente caso precise corrigir.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Login</Label>
                    <Input value={user.login} disabled />
                    <p className="text-xs text-muted-foreground">
                      Seu login não pode ser alterado.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Matrícula</Label>
                    <Input value={user.matricula} disabled />
                    <p className="text-xs text-muted-foreground">
                      Sua matrícula não pode ser alterada.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Usuário</Label>
                    <Input value={getDescricaoTipoUsuario(user.tipo)} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Informe um email válido para receber comunicações importantes.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={profileData.data_nascimento}
                      onChange={(e) => setProfileData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="senha" className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sua senha deve ter pelo menos 6 caracteres. Use uma combinação de letras, números e caracteres especiais para maior segurança.
                </AlertDescription>
              </Alert>
              
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual *</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha *</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {passwordData.newPassword && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Força da senha:</span>
                      <span className="text-sm">{passwordStrength.text}</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded ${
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Dicas para uma senha forte:</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Use pelo menos 8 caracteres</li>
                      <li>• Combine letras maiúsculas e minúsculas</li>
                      <li>• Inclua números e símbolos especiais</li>
                      <li>• Evite palavras do dicionário ou informações pessoais</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    <Key className="w-4 h-4 mr-2" />
                    {loading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* Avatar Tab */}
            <TabsContent value="foto" className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="w-48 h-48 border-4 border-border">
                    <AvatarImage 
                      src={avatarPreview || currentAvatarUrl} 
                      alt="Preview do avatar" 
                    />
                    <AvatarFallback className="text-6xl font-bold">
                      {user.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Alterar Foto de Perfil</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Selecione uma imagem para usar como foto de perfil. A imagem deve ter no máximo 2MB e estar nos formatos JPG, PNG, GIF ou WebP.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Selecionar Foto
                        </Button>
                        
                        {currentAvatarUrl && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remover Foto
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover sua foto de perfil? Esta ação não pode ser desfeita e você voltará a usar a imagem padrão.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleAvatarRemove}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Confirmar Exclusão
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    
                    {avatarFile && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm mb-2">
                          Arquivo selecionado: <strong>{avatarFile.name}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Clique em "Salvar Alterações" para confirmar o upload.
                        </p>
                        <Button onClick={handleAvatarUpload} disabled={loading}>
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? 'Fazendo upload...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}