# 🧉 Larguei Mão

> **"O que não serve mais pra ti, pode servir pra alguém."**

O **Larguei Mão** é um aplicativo mobile (e web) focado no desapego sustentável. Ele conecta pessoas que querem doar itens que não usam mais com pessoas que precisam desses itens, promovendo a economia circular e a solidariedade de forma simples, rápida e baseada na localização.

## 📱 Funcionalidades Principais

* **Exploração por Proximidade:** Veja os itens disponíveis ordenados pela distância de você (usando geolocalização e cálculo de Haversine).
* **Cadastro Rápido de Itens:** Tire uma foto, adicione um título, escolha a categoria, defina o local e poste em segundos.
* **Filtros Inteligentes:** Busque itens por categoria, distância máxima (raio de busca) ou localização específica (CEP).
* **Chat Integrado:** Converse diretamente com o doador ou interessado de forma segura dentro do app para combinar a retirada.
* **Favoritos:** Salve os itens que você gostou para não perdê-los de vista.
* **Autenticação Segura:** Login social (Google/Apple) e via E-mail/Senha suportados de forma nativa.

## 🛠️ Tecnologias Utilizadas

O projeto utiliza uma stack moderna baseada no ecossistema JavaScript/TypeScript, construído para ser "Write Once, Run Anywhere" (Web, iOS, Android).

### Frontend
* **[React 18](https://react.dev/)** + **[Vite](https://vitejs.dev/)**
* **[TypeScript](https://www.typescriptlang.org/)** para tipagem forte.
* **[Tailwind CSS](https://tailwindcss.com/)** para estilização rápida e responsiva.
* **[shadcn/ui](https://ui.shadcn.com/)** & **[Radix UI](https://www.radix-ui.com/)** para componentes acessíveis e bonitos.
* **[Framer Motion](https://www.framer.com/motion/)** para animações e transições fluidas de páginas.
* **[React Query](https://tanstack.com/query/latest)** para gerenciamento de estado assíncrono e cache.

### Backend & Auth
* **[Supabase](https://supabase.com/)** atuando como Backend-as-a-Service (BaaS).
  * *PostgreSQL* para o banco de dados.
  * *Supabase Auth* para gestão de usuários.
  * *Supabase Storage* para armazenamento de imagens.
  * *Realtime* para o chat instantâneo.

### Mobile Nativo
* **[Capacitor](https://capacitorjs.com/)** (Ionic) empacotando a aplicação web para as lojas.
* Plugins nativos para Câmera, Geolocalização, Haptics (Vibração), Splash Screen e Keyboard.

## 🚀 Como Rodar o Projeto (Desenvolvimento)

### Pré-requisitos
* **Node.js** (v18+)
* **NPM** ou **Yarn** ou **Bun**
* **Android Studio** (Para emular/buildar para Android)
* **Xcode** (Para emular/buildar para iOS - apenas Mac)

### Passos

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/larguei-mao.git
   cd larguei-mao
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento web:**
   ```bash
   npm run dev
   ```

4. **Para rodar no Mobile (Android/iOS):**
   Primeiro, faça o build e sincronize as pastas nativas:
   ```bash
   npm run build:mobile
   ```
   Em seguida, abra o projeto na IDE desejada:
   ```bash
   npx cap open android
   # ou
   npx cap open ios
   ```

## 🌐 Deploy

* **Web:** O aplicativo web e a landing page estão configurados para deploy contínuo em serviços de hospedagem estática.
* **Lojas:** Os pacotes `.aab` (Google Play) e `.ipa` (App Store) são gerados através do Android Studio e Xcode, respectivamente, mantendo a assinatura e os certificados corretos de produção.

---
Feito com 💚 para um mundo com menos desperdício.
