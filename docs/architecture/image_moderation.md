# Moderação de Imagens por Inteligência Artificial (Single Source of Truth)

Este plano descreve a implementação de um sistema definitivo e blindado para upload e moderação automática de imagens (nudez, armas de fogo, gore, drogas, nazismo/símbolos de ódio), concentrando todas as regras de negócio em uma única camada de backend.

## Arquitetura Definitiva (Single Source of Truth)

Para reduzir a superfície de ataque e centralizar as regras de negócio, **toda publicação de imagens passará obrigatoriamente pela Edge Function**. O cliente (React/Capacitor) não possuirá permissão para enviar arquivos diretamente ao bucket público de imagens.

**O Fluxo Rigoroso:**
1. **Usuário:** Seleciona a imagem no frontend.
2. **Compressão local:** O app reduz a resolução e qualidade (client-side) e envia o Multipart Stream para a Edge Function.
3. **Supabase Edge Function:**
   - Valida a autenticação do token JWT.
   - Aplica o Rate Limit.
   - Valida MIME Type e tamanho do buffer.
   - Envia para o bucket privado temporário (Quarentena).
   - Consulta a IA configurada (SightEngine).
   - Registra o resultado na tabela de logs de auditoria.
   - **Se aprovada:** Move do bucket temporário para o bucket definitivo, gerando nome UUID seguro, e devolve a URL pública.
   - **Se reprovada:** Descarta o arquivo da Quarentena e devolve erro sem vazar detalhes.
4. **App (Frontend):** Recebe somente o resultado final (URL definitiva ou Erro tratado) e continua o fluxo de salvar o post.

### Quarentena (Bucket Temporário)

As imagens são inicialmente gravadas em um bucket privado (ex: `temp-moderation`). Isso assegura que:
- Nenhuma imagem ilícita fique pública nem por um milissegundo.
- O payload não congestiona a memória da Edge Function.
- O fluxo de moderação lida apenas com referências internas.

---

## Evoluções Arquiteturais Planejadas

Embora a arquitetura principal seja suficiente para a fase Beta e para o lançamento inicial, o sistema foi estruturado desde o início para suportar crescimento, troca de fornecedores e futuras necessidades operacionais, seguindo o princípio de baixo acoplamento, alta coesão e evolução contínua.

### Camada Abstrata de Provedor (Provider Pattern)
A Edge Function não dependerá diretamente da API do SightEngine. Será criada uma camada de abstração responsável pela comunicação com o provedor de moderação. Isso permitirá substituir futuramente o SightEngine por soluções como AWS Rekognition, Google Vision AI, Azure Content Moderator ou modelos próprios de IA, sem necessidade de alterações no frontend ou na regra de negócio principal. A Edge Function continuará sendo apenas a orquestradora do processo de moderação.

### Estados de Moderação
O sistema utilizará um fluxo baseado em estados, permitindo maior controle operacional e recuperação automática em caso de falhas externas.
Estados previstos: `pending`, `approved`, `rejected`, `error`.
Essa abordagem permite que falhas temporárias do provedor de IA sejam tratadas posteriormente, evitando perda de uploads ou comportamentos inconsistentes.

### Configuração Dinâmica
Os parâmetros de moderação serão desacoplados do código-fonte. Será criada uma configuração centralizada contendo parâmetros como:
- Provedor ativo
- Moderação habilitada/desabilitada
- Limiar mínimo de confiança
- Categorias bloqueadas (nudity, weapons, drugs, gore, hate symbols)
Com isso será possível alterar regras operacionais sem necessidade de novo deploy da aplicação.

### Observabilidade e Métricas
Toda requisição de moderação registrará informações técnicas para acompanhamento operacional. Exemplos: tempo de resposta do provedor, tamanho da imagem, tipo MIME, resultado da análise, provedor utilizado, latência total da operação. Esses dados permitirão acompanhar custos, desempenho e qualidade da moderação ao longo do crescimento da plataforma.

### Rate Limiting em Múltiplas Camadas
Além do limite por usuário autenticado (ex: 10/minuto, 100/dia), a arquitetura será preparada para aplicar restrições adicionais baseadas em endereço IP, janela de tempo e frequência de requisições. Essa estratégia reduz significativamente ataques automatizados e abuso da infraestrutura.

### Limpeza Automática da Quarentena
O bucket temporário (`temp-moderation`) será tratado como armazenamento transitório. Uma rotina automática removerá periodicamente arquivos antigos que permanecerem na quarentena por tempo superior ao limite configurado, impedindo acúmulo de dados desnecessários e reduzindo custos de armazenamento.

### Identificação por Hash
Antes da moderação será calculado um hash criptográfico (SHA-256) da imagem. Isso permitirá:
- Identificar tentativas repetidas de envio do mesmo arquivo;
- Evitar chamadas desnecessárias ao provedor de IA;
- Reduzir custos de processamento;
- Acelerar respostas para conteúdos previamente bloqueados.

### Auditoria Avançada
Os registros de auditoria armazenarão metadados suficientes para rastrear qualquer operação de moderação. Entre eles: Request ID, User ID, endereço IP, User-Agent, tamanho do arquivo, MIME Type, tempo de processamento, versão do provedor, versão da política de moderação aplicada. Essas informações facilitarão investigações, suporte técnico e análise de incidentes.

### Tratamento Seguro de Erros
Mensagens retornadas ao usuário nunca revelarão detalhes internos da infraestrutura. Independentemente do motivo da reprovação, o aplicativo exibirá apenas mensagens padronizadas e amigáveis, preservando informações técnicas apenas nos logs internos. Essa prática reduz a superfície de ataque e segue o princípio de Security by Design.

### Versionamento das Políticas de Moderação
Cada análise será associada à versão da política utilizada (Exemplo: `v1`, `v2`, `v3`). Isso permitirá comparar resultados entre diferentes modelos de IA, ajustar regras gradualmente e manter rastreabilidade histórica conforme a plataforma evoluir.
