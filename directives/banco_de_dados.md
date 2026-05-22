## 1. Nomenclatura de Tabelas (Entidades Básicas)
As tabelas utilizam CamelCase e devem, obrigatoriamente, ser precedidas por um prefixo que identifica o seu módulo de negócio:
* **`Cl_` / `CL_`** (Módulo de Clientes/Parceiros): Exemplo esperado `TbCliente`, `Cl_Cadastro`, `Cl_Contatos`
* **`Pr_` / `PR_`** (Módulo de Produtos/Estoque): Exemplo esperado `TbProduto`, `Pr_Cadastro`, `Pr_Precos`
* **`Ed_` / `ED_`** (Módulo de Endereços/Logística): Exemplo esperado `Ed_Endereco`, `Ed_Bairro`, `Ed_Cidade`
* **`Us_` / `US_`** (Módulo de Usuários/Segurança): Exemplo esperado `Us_Usuario`, `Us_Perfil`, `Us_Permissao`

## 2. Nomenclatura de Campos (Colunas)
* **Caixa Alta**: Todos os campos devem ser escritos em **CAIXA ALTA (UPPERCASE)**.
* **Sufixos Identificadores**: Devem possuir um sufixo ou prefixo de 3 a 4 letras que os amarre à sua respectiva tabela:
  * **Clientes**: Sufixo `_CLI` (ex: `NOME_CLI`, `CODG_CLI`, `STATUS_CLI`)
  * **Produtos**: Sufixo `_PRO` (ex: `DESC_PRO`, `CODG_PRO`, `ATIVO_PRO`)
  * **Endereços**: Sufixo `_END` ou tipo específico como `_BAI` (Bairro), `_CID` (Cidade) (ex: `LOGRA_END`, `CODG_CID`, `NOME_BAI`)
  * **Usuários**: Sufixo `_USU` (ex: `LOGIN_USU`, `SENHA_USU`, `PERFIL_USU`)

## 3. Chaves (Primárias e Estrangeiras)
Campos que atuam como chaves de amarração (PK/FK) ou códigos de busca de relacionamento devem obrigatoriamente utilizar o termo `MCHAVE` ou `MCH` combinado com o sufixo da tabela correspondente.
* **Exemplos**: `MCHAVE_CLI`, `MCHAVE_PRO`, `MCH_USU`.

---
**Diretriz Ativa**: Qualquer nova tabela, campo, query SQL ou mapeamento criado pela inteligência artificial para o banco de dados deve adotar estes prefixos e sufixos conforme o contexto.
