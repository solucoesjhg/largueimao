import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border/50 bg-background/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="ml-2 text-lg font-semibold text-foreground">Política de Privacidade</h1>
      </header>

      <main className="px-6 py-8 prose prose-sm dark:prose-invert max-w-none text-foreground/80">
        <h2 className="text-xl font-bold text-foreground mb-4">1. Informações que Coletamos</h2>
        <p className="mb-4">
          O aplicativo <strong>Larguei Mão</strong> coleta os seguintes dados para garantir o seu funcionamento:
        </p>
        <ul className="list-disc pl-5 mb-6 space-y-2">
          <li><strong>Dados de Conta:</strong> Nome, e-mail e foto de perfil, fornecidos durante o cadastro (incluindo login via Apple ou Google) para identificar os usuários na plataforma.</li>
          <li><strong>Localização (Aproximada/Precisa):</strong> Coletada apenas com sua permissão explícita para mostrar anúncios de itens que estejam fisicamente próximos a você.</li>
          <li><strong>Câmera e Galeria:</strong> Acessadas apenas quando você decide publicar um anúncio ou atualizar sua foto de perfil. Nenhuma imagem é coletada sem sua ação direta.</li>
          <li><strong>Dados de Uso:</strong> Informações básicas de navegação para nos ajudar a identificar bugs e melhorar a experiência do aplicativo.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mb-4">2. Como Usamos as Informações</h2>
        <p className="mb-6">
          Utilizamos seus dados exclusivamente para:
          <br/>- Permitir a criação e exibição dos seus anúncios.
          <br/>- Conectar compradores e vendedores através do chat integrado.
          <br/>- Mostrar a distância aproximada entre você e os itens anunciados.
          <br/>- Enviar notificações push (se autorizadas) sobre mensagens no chat, itens favoritados ou alterações de preço.
        </p>

        <h2 className="text-xl font-bold text-foreground mb-4">3. Compartilhamento de Dados</h2>
        <p className="mb-6">
          Nós <strong>não vendemos</strong> seus dados pessoais para terceiros. As informações públicas do seu perfil (Nome e Foto) e a localização aproximada do item serão visíveis para outros usuários do aplicativo para viabilizar as negociações. Utilizamos serviços de terceiros (como Supabase para banco de dados) que seguem rigorosos padrões de segurança.
        </p>

        <h2 className="text-xl font-bold text-foreground mb-4">4. Exclusão de Conta e Dados</h2>
        <p className="mb-6">
          Você tem o direito de solicitar a exclusão total da sua conta e de todos os dados associados a ela a qualquer momento. Para isso, basta acessar a aba de Perfil no aplicativo e utilizar a opção "Excluir Conta", ou entrar em contato conosco.
        </p>

        <h2 className="text-xl font-bold text-foreground mb-4">5. Segurança</h2>
        <p className="mb-6">
          Empregamos medidas de segurança padrão da indústria para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
        </p>

        <h2 className="text-xl font-bold text-foreground mb-4">6. Alterações nesta Política</h2>
        <p className="mb-6">
          Podemos atualizar nossa Política de Privacidade periodicamente. Avisaremos sobre quaisquer mudanças significativas através do próprio aplicativo ou por e-mail.
        </p>

        <p className="text-sm text-muted-foreground mt-8">
          Última atualização: {new Date().toLocaleDateString('pt-BR')}
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
