# GIAC — Gestão Integrada de Auto Controles

## Histórico de requisições e construções do projeto

**Produto:** Sistema de gestão documental e autocontrole para indústrias de alimentação animal, conforme IN 04/2007 (MAPA) e os 7 Princípios do APPCC (BPF, POPs, rastreabilidade, não conformidades).
**Stack:** React + Vite + TypeScript + Tailwind (SPA) com backend PocketBase (Skip Cloud).
**Idioma:** pt-BR. Estética do agro brasileiro (verdes/âmbar).
**Acesso master:** helio@dpharma.com.br / Skip@Pass
**Versão atual:** v0.0.30

---

## Decisões e regras permanentes do produto

- Cobrança do SaaS é **por CNPJ** (uma mensalidade por organização, não por usuário); precificação por complexidade/valor por usuário ficou para o futuro. Valores provisórios editáveis até o software estar pronto.
- Hierarquia de permissões: **RE > RT > RQ > usuários por setor**. RE substitui/edita o RT; RT assina todos os documentos; RQ verifica; demais perfis só preenchem e assinam execução. Todo POP/registro exige: assinatura de RT ou RE + assinatura do RQ.
- Edição de POPs só é permitida com a senha do administrador da organização cliente (mensalista ou plano anual).
- Prioridade de evolução: conectar o Auto Controle 01 aos ACs 05 e 09 (rastreabilidade); NÃO configurar Asaas real nem replicar fluxos nos demais POPs neste momento.

---

## Base entregue (iterações iniciais)

- **Layout global:** sidebar fixa (280px, verde escuro) com logo, navegação e perfil do usuário; header com sino de notificações e botão de Nova Auditoria; fundo #F5F1E8; footer com versão.
- **Autenticação:** /login (card sobre imagem de campo, credencial de demonstração exibida) e /register; rotas protegidas com redirecionamento.
- **Visão Geral (dashboard):** saudação personalizada, cards de indicadores (Procedimentos Ativos, Registros no Mês, etc.).
- **9 Auto Controles padrão (POP-001 a POP-009):** Qualificação de Fornecedores; Limpeza e Higienização; Higiene e Saúde do Pessoal; Potabilidade da Água; Prevenção de Contaminação Cruzada; Manutenção e Calibração; Controle Integrado de Pragas; Controle de Resíduos e Efluentes; Rastreabilidade e Recolhimento.
- **Módulos:** Registros, Auditorias (checklist TF-Autocontroles), Rastreabilidade (testes de rastreio lote a lote), Não Conformidades (RNC com plano de ação), Treinamentos, Documentos, Empresa (base SIPEAGRO), Assinaturas, Painel Super Admin, Trilha de Auditoria.
- **Planos e cobrança:** planos mensal/anual com faturas; integração de pagamento planejada (Asaas) — não ativada ainda.

---

## Evoluções por versão

### v0.0.14 — Hierarquia RE > RT > RQ e proteção de registros

- Módulo centralizado de permissões (`permissions.ts`), eliminando checagens espalhadas.
- RE com poderes plenos de RT em formulários, registros e construtor de formulários.
- admin_cliente como gestor pleno da própria organização.
- Régua de assinatura validada no backend: Assinatura 1 = RT ou RE; Assinatura 2 = RQ.
- Registro "Comprovado" (dupla assinatura) não pode mais ser excluído — nem na tela, nem no backend.
- Log anti-falsificação: toda criação/edição/exclusão/assinatura grava em `audit_logs` com autor, perfil, valores antes → depois e carimbo de tempo; trilha imutável para clientes.

### v0.0.15 — Histórico & Integridade visíveis

- Selo de integridade por registro/POP: Íntegro (Comprovado), Retificado (N rev.), Íntegro, Não Iniciado — com tooltip explicativo.
- Linha do tempo por registro ("Histórico & Integridade"): quem criou, edições com valores antes → depois em linguagem legível, assinaturas (RT/RE/RQ, método e hash), exclusões; bloco técnico JSON expansível.
- Coluna "Integridade" + botão "Histórico" em /registros (visível para admin_cliente, RE, RT, RQ).
- Selo e histórico também no detalhe do POP (incluindo monitoramento do Item 07).
- Página /trilha-auditoria no menu lateral: trilha completa da organização com filtros (coleção, ação, período, usuário, busca).
- /admin → aba "Auditoria Master": visão global de todas as organizações + exportação CSV com carimbo oficial (para MAPA/auditorias).
- Performance: paginação incremental no backend + índices por organização, registro e data.

### v0.0.16 — Renomeação do item PAASO

- Item do menu "PAASO (Fornecedores)" renomeado para "Qualificação de Fornecedores" (desktop e mobile; rota /paaso preservada).

### v0.0.17 / v0.0.18 — Nomenclatura dos procedimentos

- Todos os procedimentos exibidos como "Auto Controle NN – Nome Resumido" (ex.: "Auto Controle 01 – Qualificação de Fornecedores").
- Aplicado em: listagem e detalhe, PDFs, painel de pendências, editor normativo, construtor de formulários, dashboard, Registros, Documentos, Auditorias (itens 18–40 do checklist), Rastreabilidade e Trilha de Auditoria.
- Códigos internos (POP-001), rotas e lógica de cadeia preservados de propósito.
- Siglas RE, RT, RQ, RNC e BPF mantidas.

### v0.0.19 / v0.0.20 — Alinhamento de títulos

- Item do menu "Procedimentos" renomeado para "Auto Controles".
- Título da página /paaso alinhado ao item do menu ("Qualificação de Fornecedores").

### v0.0.21 — Integração da ferramenta Adapta One 27 (Qualificação)

- Porte nativo da Iteração 1 "QualificaFornecedor" (artefato Adapta): base de referência de 24 estabelecimentos SIPEAGRO e motor de cruzamento com 7 verificações.
- 5 cenários oficiais de teste como botões de "Preenchimento Rápido" na aba Qualificação & Cruzamento (Aprovado Total; Ressalva por nome; Reprovado por categoria; Reprovado por tipo; Não Encontrado) + botão Limpar Formulário.
- Snapshot original acessível como aba "Ferramenta Adapta One 27" (iframe com tela cheia).
- Qualificações gravadas no banco da organização, com evento na trilha de auditoria; teste automatizado garante paridade dos 5 cenários com o motor nativo.

### v0.0.22 — Cadastro de Fornecedor (POP 01-AC01) e auto avaliação

- Selo do módulo renomeado para "PAC-01_R0001 - QUALIFICAÇÃO DE FORNECEDORES".
- Formulário de Auto Avaliação do Fornecedor com 4 seções (fiel à planilha do cliente):
  1. Cabeçalho (código, elaboração, edição, revisão — editáveis);
  2. Dados Cadastrais (CNPJ com preenchimento automático pelo SIPEAGRO);
  3. Tipo de Fornecedor & Qualidade (tipo, registro MAPA/ANVISA ou isenção, categorias, programas BPF/GMP, APPCC, GMP+, FAMIQS);
  4. Questionário de 20 itens com colunas C/NC/NA (NA conta como conforme), evidência por item, totais automáticos e NOTA FINAL = (Conformes + NA) ÷ 20 × 100 (limiar configurável; exemplo: 10C + 2NA = 60% → REPROVADO). Campo "Avaliação Final" de uso exclusivo do CQ.
- Preenchimento automático por CNPJ na base SIPEAGRO: razão social, registro, situação (badge ATIVO/SUSPENSO), UF, município, categorias (Fabricante 1; Fracionador 2; Importador 3; Armazenador 4) e tipos de produto habilitados (Aditivo, Alimento, Concentrado, Coproduto, Ingrediente, Núcleo, Premix, Produto mastigável, Ração, Suplemento).
- Questionário importável via .xlsx e persistido no banco (editável sem nova versão do sistema).
- Assinaturas conforme hierarquia + exportação em PDF regulatório.

### v0.0.23 / v0.0.24 — Auto avaliação como primeiro registro obrigatório da cadeia

- Aba renomeada para "Cadastro de Fornecedor (POP 01-AC01)".
- Cadeia do Auto Controle 01: Auto Avaliação → Recebimento de MP → Coleta de Amostra → Laudo → Destinação/Ação Corretiva (quando reprovado).
- Auto avaliação aprovada (≥ 70%) libera o Recebimento; reprovada abre Ação Corretiva de imediato.
- Sem auto avaliação homologada vigente → cadeia Incompleta com pendência crítica.
- Recebimento de MP exige fornecedor qualificado (reprovado/suspenso é bloqueado na hora).
- Homologação/reprovação reflete na Lista Oficial de Fornecedores Qualificados (Anexo II).

### v0.0.25 — Importador SIPEAGRO corrigido + troca de botão

- Defeito corrigido: importador abortava após ~106 linhas (limite de gravações do backend); agora grava em lotes transacionais no servidor, com retentativa e progresso em tempo real.
- Filtro estrito de apenas estabelecimentos ATIVOS; resumo final (lidas, importados, novos, atualizados, inativados); registro na auditoria de importações.
- Botão "Excluir base importada" na aba Base SIPEAGRO (confirmação digitando EXCLUIR; preserva dados de exemplo).
- Botão "Carregar dados de exemplo" substituído por "Cadastro de Fornecedor (POP 01-AC01)".
- Planilha de referência: ListadeEstabelecimentosSIPEAGRO05.08.2026.xlsx — 5.721 linhas; cabeçalho deslocado detectado automaticamente; CNPJ/CPF na coluna F; upsert por CNPJ (reimportação atualiza e inativa sumidos); categorias e tipos de produto reconhecidos.

### v0.0.26 / v0.0.27 — Pacote de 7 frentes

1. **Programação (cronograma):** agendamento de qualquer registro dos Auto Controles com periodicidade diária/semanal/mensal/anual, turno e dia; agenda Dia/Semana/Mês/Ano com filtros (atrasados, pendentes, aguardando aprovação, aprovados); busca, impressão e revalidação.
2. **Vencimento/validade nos formulários:** campo opcional no construtor (+ validade padrão e dias de antecedência do lembrete); status VIGENTE / A VENCER / VENCIDO com botão de revalidação.
3. **Cronograma de treinamentos por POP:** vínculo com Auto Controle e assunto livre; entra na agenda geral.
4. **Auditorias isoladas:** abertura/agendamento apenas dentro do módulo /auditorias (botão global removido do header).
5. **Aba Prevenção da Contaminação Cruzada (AC 05):** 6 métodos conforme IN 04/2007 — qualificação de fornecedores e transportadores; segregação de matérias-primas; limpeza e código de cores de utensílios; desenho sanitário de equipamentos; limpeza de linha/sequenciamento/flushing; BPF de sacarias e ensaque — com parâmetros críticos, pontos de inspeção e ações corretivas, editável e assinável (RT/RE + RQ).
6. **Banco de dados do AC 02 (Limpeza):** cadastros de setores, produtos por tipo de superfície, equipamentos e matriz setor × produto × tipo de limpeza; formulário F-LIMPEZA-01 puxa tudo em seletores; assinatura do responsável do setor (execução) + aprovação da Qualidade (RQ) + RT/RE.
7. **Portal do Fornecedor (POP 01-AC01 online):** botão "Gerar Link do Portal do Fornecedor"; fornecedor preenche pré-cadastro (CNPJ, contato, telefone, e-mail) + seções 2, 3 e 4; submissão chega como pendente de validação com cruzamento SIPEAGRO; aprovação interna com a hierarquia de assinaturas. (Entrega do link copiável — e-mail contratado ainda não existe.)

### v0.0.28 — Árvore Raiz + zeragem Master e empresas de teste

- **Árvore Raiz em /procedimentos:** alternador "Árvore Raiz"/"Tabela". Raiz = Auto Controle; ramos: descritivos mínimos e parâmetros de execução (editáveis); formulários e fichas anexadas (catálogo IN 04/2007 + personalizadas, com botão Editar via PopFormBuilderModal); registros preenchidos e evidências vinculadas (status de conformidade e integridade de assinatura). Ação "Anexar Registro" na raiz. Nova aba "Árvore Raiz & Registros" no detalhe do POP.
- **/admin → Zerar Dados Fictícios (Master):** apaga registros de teste, fornecedores de exemplo, SIPEAGRO fictício, qualificações, treinamentos, NCs e auditorias de teste de todas as organizações; confirmação digitando MASTER-ZERAR; relatório em tempo real por coleção. Preserva: organizações, usuários, os 9 Auto Controles com estrutura, planos/faturas, base SIPEAGRO real importada e trilha de auditoria.
- **/admin → Criar Empresa de Teste:** organização nova e limpa (só com os 9 Auto Controles) com 5 usuários por hierarquia (RE, RT, RQ, Operador Produção, Operador Limpeza) e credenciais exibidas na hora.

### v0.0.29 / v0.0.30 — Menu reordenado + correção da zeragem (401)

- **Menu lateral reordenado/renomeado** (desktop e mobile, com teste automatizado travando a ordem): 1) Visão Geral; 2) Qualificação de Fornecedores; 3) Auto Controles (Pops); 4) Rotinas e Programação; seguem Registros, Auditorias, Rastreabilidade, Não Conformidades, Treinamentos, Documentos, Trilha de Auditoria, Empresa (SIPEAGRO), Assinatura e Painel Super Admin.
- **Causa do 401 na zeragem:** rotas registradas com `routerAdd` no PocketBase sem `$apis.requireAuth()` não processavam o token JWT — `authRecord` nulo e rejeição imediata. Corrigido em `master_reset_data.js` e `create_test_organization.js` (extração via `c.auth || c.get('authRecord')`, role defensivo, corpo com fallbacks, zeragem em `$app.runInTransaction`, evento MASTER_RESET_ALL_DATA na trilha com nome do executor).
- Validado ponta a ponta com a credencial master (dados de teste apagados — comportamento esperado).

---

## Pendências / backlog acordado

1. **Conectar Auto Controle 01 aos ACs 05 e 09** na rastreabilidade (prioridade definida).
2. **Importar a 2ª aba SIPOA** (estabelecimentos orgânicos) como base separada.
3. **Banco Global de Fornecedores Validados:** alimentado automaticamente pelas homologações de todas as empresas (apenas dados públicos — CNPJ, razão social, categorias, produtos, situação SIPEAGRO — e contador de quantas empresas aprovaram; NUNCA questionário, evidências ou notas); acesso restrito a organizações com plano em dia; no Cadastro de Fornecedor, consultar o banco ao digitar um CNPJ; acesso via /admin e módulo de fornecedores. (Escopo confirmado em princípio, aguardando execução.)
4. **Iteração 3 do PAASO:** lembrete agendado para importação mensal do MAPA + envio real de e-mail (incl. convites do portal). Download automático da planilha depende de Conector (não habilitado para a organização).
5. **Relatório anual (Item 64)** consolidando avaliações e cadeias comprovadas.
6. **Migração para dados reais:** zerar fictícios, criar empresa de teste e cadastrar a empresa real.
7. **Chave Asaas** (cobrança real por CNPJ).
8. Portal do fornecedor com envio automático de e-mail (depende de e-mail contratado).

## Limitações técnicas conhecidas

- Sem Conectores habilitados: sem download automático da planilha do MAPA nem integrações (Google Sheets, Gmail, Drive).
- Sem serviço de e-mail contratado: convites/lembretes entregues via link copiável.
- Base SIPEAGRO real importada é preservada nas zeragens (flag `is_exemplo`).
