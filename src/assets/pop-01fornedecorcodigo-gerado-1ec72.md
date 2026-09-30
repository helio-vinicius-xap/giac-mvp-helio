# PAASO — Núcleo de Qualificação de Fornecedores + Painel (Iteração 1)

## Contexto e Objetivo

Construir um sistema web single-page chamado **PAASO** para qualificação de fornecedores de insumos para alimentação animal, tendo como base oficial a lista de estabelecimentos registrados no SIPEAGRO (Ministério da Agricultura e Pecuária — MAPA), publicada semanalmente em arquivo .xlsx.

Esta Iteração 1 entrega o **NÚCLEO** (base SIPEAGRO importável, cadastro de fornecedores, formulário de qualificação, motor de cruzamento automático, registros de devoluções e não conformidades) e o **PAINEL de indicadores**. O sistema roda 100% no navegador, sem backend, com persistência local e backup por export/import JSON.

## Especificações Técnicas

- **Frontend**: HTML5 + CSS3 + JavaScript vanilla, aplicação single-page com navegação por abas
- **Parsing de planilha**: SheetJS (xlsx) via CDN — leitura do arquivo .xlsx do MAPA
- **Gráficos**: Chart.js via CDN
- **Persistência**: localStorage organizado em coleções; export/import de arquivo JSON para backup
- **Backend**: nenhum nesta iteração
- **Idioma**: pt-BR; datas em DD/MM/AAAA; CNPJ exibido como 00.000.000/0000-00

## Modelo de Dados (coleções)

### 1. sipeagro — base oficial importada do MAPA

- cnpj (string 14 dígitos, sem máscara, CHAVE ÚNICA)
- razao_social (nome do estabelecimento)
- registro_sipeagro (número do registro no MAPA)
- situacao (somente "ATIVO" é importado)
- uf (2 letras), municipio
- categoria (enum: fabricante | fracionador | importador | armazenador)
- tipos_produto (array — somente tipos com valor 1, 2 ou 3 na linha do CNPJ)
- arquivo_origem (data do arquivo MAPA, ex.: 04/08/2026), importado_em (data/hora)

Tipos de produto válidos (lista fixa): aditivo, alimento, concentrado, coproduto, ingrediente, núcleo, premix, produto mastigável, ração, suplemento.

### 2. fornecedores

cnpj (chave), razao_social, contato_nome, email, telefone, uf, municipio, criado_em, observacoes

### 3. qualificacoes

id, fornecedor_cnpj, data_formulario, dados_declarados {razao_social, registro_sipeagro, categoria, tipos_produto[], uf, municipio}, resultado (APROVADO | APROVADO_COM_RESSALVA | REPROVADO | PENDENTE_REVISAO), score (0–100), divergencias[], validade (data_formulario + 12 meses), status_vigencia (VIGENTE | VENCIDA)

### 4. devolucoes

id, data, fornecedor_cnpj, produto, lote, motivo, quantidade, valor, status

### 5. nao_conformidades

id, data, fornecedor_cnpj, descricao, severidade (BAIXA | MEDIA | ALTA | CRITICA), acao_corretiva, prazo, status (ABERTA | EM_TRATAMENTO | ENCERRADA)

### 6. auditoria_importacoes

id, data_hora, arquivo_origem, total_linhas, total_ativos, novos_cnpj, inativados_cnpj[], status (SUCESSO | ERRO), mensagem

## Funcionalidades

### Feature 1: Importação da base SIPEAGRO (aba "Base SIPEAGRO")

**Descrição**: atualização da base oficial a partir do arquivo .xlsx publicado pelo MAPA (o nome do arquivo segue o padrão ListadeEstabelecimentosSIPEAGRODD.MM.AAAA.xlsx e muda a cada publicação; página de origem: https://www.gov.br/agricultura/pt-br/assuntos/insumos-agropecuarios/insumos-pecuarios/alimentacao-animal).
**Comportamento esperado**:

- Botão "Importar planilha do MAPA" abre seletor de arquivo .xlsx (fluxo principal)
- Campo opcional com URL direta do arquivo + botão "Buscar online": tenta fetch; se falhar por CORS, orienta o download manual e o upload
- Parser detecta a linha de cabeçalho automaticamente e mapeia colunas por nome com tolerância (acentos, espaços, maiúsculas); colunas de tipos de produto reconhecidas pelos 10 nomes fixos
- Normalização: CNPJ sem máscara; mantém somente linhas com situação ATIVO; tipos_produto = colunas com valor 1, 2 ou 3 na linha
- Upsert por CNPJ: atualiza existentes, insere novos, marca inativados (estavam na importação anterior e sumiram/ficaram inativos)
- Ao final, registra auditoria e exibe resumo: total de linhas, ativos, novos, inativados, data do arquivo
  **Requisitos técnicos**:
- Cabeçalho esperado não encontrado → ABORTAR sem alterar a base, com mensagem clara
- CNPJ duplicado no arquivo → manter a última ocorrência
- Processar em blocos com barra de progresso (planilhas com milhares de linhas não podem travar a interface)
- Erro na importação nunca corrompe a base anterior (processa em memória e só grava se tudo ok)

### Feature 2: Fornecedores (aba "Fornecedores")

- Lista com busca por CNPJ/razão social/UF, status da qualificação vigente e contadores de devoluções e NC abertas
- Cadastro manual com validação de CNPJ (dígitos verificadores)
- Botão "Formulário de qualificação" abre o formulário preenchível (Iteração 1: formulário interno; botão mailto: opcional para enviar o link por e-mail ao fornecedor)

### Feature 3: Formulário de qualificação + cruzamento (aba "Qualificação")

**Descrição**: formulário prévio preenchido pelo fornecedor; ao salvar, o sistema cruza automaticamente com a base SIPEAGRO.
**Campos**: CNPJ (obrigatório), razão social, registro SIPEAGRO, categoria declarada, tipos de produto declarados (checkbox dos 10 tipos), UF, município, contato, e-mail.
**Motor de cruzamento — 7 verificações**:

1. CNPJ existe na base SIPEAGRO importada
2. Situação ATIVO
3. Razão social confere (similaridade ≥ 90% após normalizar maiúsculas, acentos e pontuação)
4. Categoria declarada = categoria da base
5. Todo tipo de produto declarado consta nos tipos_produto da base (valor 1, 2 ou 3)
6. Registro SIPEAGRO declarado = registro da base
7. UF e município conferem (divergência gera ressalva, não reprovação)
   **Regras de resultado**:

- Falha em 1, 2, 4 ou 5 → REPROVADO
- Divergência apenas em 3, 6 ou 7 → APROVADO COM RESSALVA (listar divergências)
- Tudo conforme → APROVADO
- CNPJ não encontrado ou base SIPEAGRO vazia → PENDENTE DE REVISÃO
- Score: base 100; −25 razão social; −15 registro; −10 localização; reprovação zera
- Validade de 12 meses; qualificação vencida aparece como VENCIDA em todo o sistema

### Feature 4: Devoluções e Não Conformidades (abas "Devoluções" e "Não Conformidades")

- CRUD completo com formulários simples e listagem filtrável por fornecedor e período
- Devolução vinculada ao fornecedor por CNPJ com autocomplete
- NC: fluxo de status ABERTA → EM_TRATAMENTO → ENCERRADA, com destaque para prazos estourados

### Feature 5: Painel de indicadores (aba "Painel")

**Cards de topo**: fornecedores cadastrados; qualificações vigentes; vencidas; reprovadas; NC abertas; devoluções no período
**Gráficos**:

- Donut: status das qualificações (aprovado / ressalva / reprovado / pendente)
- Barras: fornecedores por UF e por categoria
- Linha: evolução mensal de devoluções e NC (últimos 12 meses)
- Barras horizontais: top 5 fornecedores por devoluções e por NC abertas
  **Tabelas de atenção**: fornecedores com qualificação vencida; NC com prazo estourado
  **Filtros**: período, UF, categoria
  **Requisito**: todos os indicadores calculados a partir das coleções (nenhum valor fixo); recálculo imediato após qualquer cadastro/importação

## Requisitos Não-Funcionais

- Responsivo: usável em desktop e tablet (breakpoints 1024px e 640px)
- Botões "Exportar backup (JSON)" e "Importar backup" no cabeçalho
- Botão "Carregar dados de exemplo": popula ~20 estabelecimentos SIPEAGRO fictícios, 5 fornecedores, qualificações, devoluções e NC variadas, somente sob confirmação e marcados como exemplo
- Nenhuma chamada externa além dos CDNs; sem alert() nativo — usar toasts em português

## Regras de Implementação

1. Chave primária de pessoa é sempre o CNPJ normalizado (14 dígitos, só números)
2. Validar CNPJ por dígitos verificadores em todos os formulários
3. Código organizado em módulos: storage, parser, cruzamento, ui — parser e cruzamento como funções puras
4. Sem frameworks de build, backend, banco remoto ou chamadas autenticadas nesta iteração
5. Toda ação do usuário gera feedback visual imediato (toast ou atualização de tela)

## Priorização

1. Modelo de dados + importação SIPEAGRO (Feature 1)
2. Formulário + motor de cruzamento (Features 2 e 3)
3. Devoluções e NC (Feature 4)
4. Painel (Feature 5)
5. Backup JSON e seed de demonstração

## Entregáveis Esperados

- [ ] Aplicação single-page com abas: Base SIPEAGRO, Fornecedores, Qualificação, Devoluções, Não Conformidades, Painel
- [ ] Importação funcional do .xlsx do MAPA com auditoria e resumo
- [ ] Cruzamento automático com os 4 resultados possíveis e score
- [ ] Painel com cards, 4 gráficos, tabelas de atenção e filtros
- [ ] Export/import de backup JSON e seed de demonstração
