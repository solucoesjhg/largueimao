# Diretrizes de Nomenclatura e Arquitetura Delphi-Like

Para mantermos a padronização, organização e alta legibilidade em todo o projeto, as seguintes regras devem ser rigorosamente aplicadas em novas implementações ou refatorações de código:

## 1. Prefixos de Variáveis e Parâmetros
Para separar escopos e identificar imediatamente a origem dos dados:
- **`L` (Local)**: Todas as variáveis ou constantes locais do componente devem usar o prefixo `L`. 
  Exemplo: `const LUser = ...`, `const LNavigate = ...`, `const LIsLoading = ...`
- **`A` (Argumento/Parâmetro)**: Todos os parâmetros de funções ou callbacks devem usar o prefixo `A`.
  Exemplo: `(AEvent: React.MouseEvent) => ...`, `(AItem: ItemType) => ...`

## 2. Padrões de Verbos e Ações em Português
A lógica pesada de negócio não deve ficar "jogada" dentro de blocos soltos como `useQuery` ou `useEffect`. Toda ação principal deve ser extraída em funções descritivas utilizando verbos de ação claros e em português.
Exemplo: `pesquisarChats()`, `incluirMensagem()`, `atualizarPerfil()`, `removerFavorito()`.

## 3. Fragmentação Declarativa de UI (Variáveis de View)
Evite blocos gigantescos de HTML/JSX no retorno final do componente. Quebre a árvore de UI em pedaços lógicos organizados em variáveis ou constantes antes do return final. Utilize prefixos semânticos do padrão Delphi:
- `pnl` (Panel/Painel) para blocos, seções ou containers maiores: `const pnlNavegacao = <div>...</div>`
- `btn` (Button/Botão) para elementos acionáveis: `const btnSalvar = <button>...</button>`
- `edt` (Edit/Input) para campos de digitação/formulário: `const edtPesquisa = <input />`

O `return` final do seu componente React deve ficar extremamente limpo e declarativo, apenas montando essas constantes. Exemplo: `return <>{pnlHeader} {pnlMain} {pnlFooter}</>`.

## 4. Indentação e Estilo de Código (1TBS)
Devemos respeitar a abertura de chaves na mesma linha da declaração original, conhecido como formato 1TBS (One True Brace Style), suportado pelos formatadores modernos (como o Prettier).
Exemplo:
```tsx
if (LUser) {
  // Lógica aqui
}
```
Não mova a chave `{` para a linha de baixo. Assim, evitamos brigas com o formatador automático padrão do VS Code.
