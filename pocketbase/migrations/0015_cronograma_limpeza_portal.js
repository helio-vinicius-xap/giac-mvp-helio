migrate(
  (app) => {
    const orgsCol = app.findCollectionByNameOrId('organizations')
    const orgsId = orgsCol.id
    const proceduresCol = app.findCollectionByNameOrId('procedures')
    const proceduresId = proceduresCol.id

    const rlsRule =
      "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"

    // 1. Alterar collection 'trainings' para incluir pop_codigo e procedimento
    try {
      const trainingsCol = app.findCollectionByNameOrId('trainings')
      if (!trainingsCol.fields.getByName('pop_codigo')) {
        trainingsCol.fields.add(new TextField({ name: 'pop_codigo', required: false }))
      }
      if (!trainingsCol.fields.getByName('procedure')) {
        trainingsCol.fields.add(
          new RelationField({
            name: 'procedure',
            required: false,
            collectionId: proceduresId,
            maxSelect: 1,
            cascadeDelete: false,
          }),
        )
      }
      app.save(trainingsCol)
    } catch (e) {
      console.log('Erro ao atualizar trainings:', e)
    }

    // 2. Alterar collection 'records' para incluir data_validade e dias_lembrete_vencimento
    try {
      const recordsCol = app.findCollectionByNameOrId('records')
      if (!recordsCol.fields.getByName('data_validade')) {
        recordsCol.fields.add(new DateField({ name: 'data_validade', required: false }))
      }
      if (!recordsCol.fields.getByName('dias_lembrete_vencimento')) {
        recordsCol.fields.add(
          new NumberField({ name: 'dias_lembrete_vencimento', required: false }),
        )
      }
      if (!recordsCol.fields.getByName('status_validade')) {
        recordsCol.fields.add(
          new SelectField({
            name: 'status_validade',
            required: false,
            values: ['VIGENTE', 'A_VENCER', 'VENCIDO'],
            maxSelect: 1,
          }),
        )
      }
      app.save(recordsCol)
    } catch (e) {
      console.log('Erro ao atualizar records:', e)
    }

    // 3. Collection 'programacao_registros' (Raiz de agendamentos obrigatórios e cronogramas)
    let progCol
    try {
      progCol = app.findCollectionByNameOrId('programacao_registros')
    } catch (_) {
      progCol = new Collection({
        name: 'programacao_registros',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'procedure',
            type: 'relation',
            required: false,
            collectionId: proceduresId,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'pop_codigo', type: 'text', required: true }, // ex: POP-001, POP-002
          { name: 'formulario_codigo', type: 'text', required: true }, // ex: F-01-POP-001, F-LIMPEZA-01
          { name: 'titulo', type: 'text', required: true },
          {
            name: 'periodicidade',
            type: 'select',
            required: true,
            values: ['diaria', 'semanal', 'mensal', 'anual'],
            maxSelect: 1,
          },
          { name: 'data_inicio', type: 'date', required: true },
          { name: 'data_fim', type: 'date', required: false },
          { name: 'turno_preferencial', type: 'text', required: false }, // Manhã / Tarde / Noite / Qualquer
          { name: 'setor', type: 'text', required: false },
          { name: 'responsavel_cargo', type: 'text', required: false },
          { name: 'dias_semana', type: 'json', required: false }, // [1,2,3,4,5] para dias específicos
          { name: 'dia_mes', type: 'number', required: false }, // 1..31
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_prog_org ON programacao_registros (organization)',
          'CREATE INDEX idx_prog_pop ON programacao_registros (pop_codigo)',
          'CREATE INDEX idx_prog_form ON programacao_registros (formulario_codigo)',
        ],
      })
      app.save(progCol)
    }

    // 4. Collection 'limpeza_setores' (Auto Controle 02 - Setores e Áreas Fabris)
    let setCol
    try {
      setCol = app.findCollectionByNameOrId('limpeza_setores')
    } catch (_) {
      setCol = new Collection({
        name: 'limpeza_setores',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'codigo', type: 'text', required: true }, // ex: SET-MOAGEM, SET-ENSAQUE
          { name: 'nome', type: 'text', required: true }, // ex: Moagem e Peneiramento
          { name: 'descricao', type: 'text', required: false },
          { name: 'tipo_area', type: 'text', required: false }, // seca, úmida, externa, depósito
          { name: 'responsavel_setor', type: 'text', required: false },
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_limp_set_org ON limpeza_setores (organization)',
          'CREATE INDEX idx_limp_set_cod ON limpeza_setores (codigo)',
        ],
      })
      app.save(setCol)
    }

    // 5. Collection 'limpeza_produtos' (Auto Controle 02 - Sanitizantes e Detergentes homologados)
    let prodCol
    try {
      prodCol = app.findCollectionByNameOrId('limpeza_produtos')
    } catch (_) {
      prodCol = new Collection({
        name: 'limpeza_produtos',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'nome_comercial', type: 'text', required: true },
          { name: 'principio_ativo', type: 'text', required: false }, // ex: Quaternário de amônio, Ácido peracético
          {
            name: 'categoria',
            type: 'select',
            required: true,
            values: [
              'Detergente Alcalino',
              'Detergente Neutro',
              'Sanitizante',
              'Desengraxante',
              'Outro',
            ],
            maxSelect: 1,
          },
          { name: 'concentracao_recomendada', type: 'text', required: false }, // ex: 2.0%
          { name: 'tempo_contato_minutos', type: 'number', required: false }, // ex: 15
          { name: 'superficies_aplicacao', type: 'json', required: false }, // ['Inox 304', 'Piso Epóxi', 'Borracha']
          { name: 'registro_anvisa_mapa', type: 'text', required: false },
          { name: 'ficha_fispq', type: 'text', required: false },
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_limp_prod_org ON limpeza_produtos (organization)'],
      })
      app.save(prodCol)
    }

    // 6. Collection 'limpeza_equipamentos' (Auto Controle 02 - Equipamentos e Maquinários)
    let equipCol
    try {
      equipCol = app.findCollectionByNameOrId('limpeza_equipamentos')
    } catch (_) {
      equipCol = new Collection({
        name: 'limpeza_equipamentos',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'tag', type: 'text', required: true }, // ex: EQ-MIS-01
          { name: 'nome', type: 'text', required: true }, // ex: Misturador Helicoidal Principal
          { name: 'setor_nome', type: 'text', required: false },
          { name: 'tipo_superficie', type: 'text', required: false }, // Inox, Aço Carbono, Polietileno
          { name: 'metodos_limpeza_permitidos', type: 'json', required: false }, // ['Seca', 'Úmida', 'Flushing']
          { name: 'cuidados_especiais', type: 'text', required: false },
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_limp_eq_org ON limpeza_equipamentos (organization)',
          'CREATE INDEX idx_limp_eq_tag ON limpeza_equipamentos (tag)',
        ],
      })
      app.save(equipCol)
    }

    // 7. Collection 'limpeza_procedimentos_matriz' (Relação estrutural e funcional: Setor × Equipamento × Superfície × Produto × Tipo de Limpeza)
    let matrizCol
    try {
      matrizCol = app.findCollectionByNameOrId('limpeza_procedimentos_matriz')
    } catch (_) {
      matrizCol = new Collection({
        name: 'limpeza_procedimentos_matriz',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'codigo_procedimento', type: 'text', required: true }, // ex: POP02-PR-01
          { name: 'setor', type: 'text', required: true },
          { name: 'equipamento_ou_area', type: 'text', required: true },
          { name: 'tipo_superficie', type: 'text', required: false }, // Inox, Aço Carbono, Epóxi, Vidro
          {
            name: 'tipo_limpeza',
            type: 'select',
            required: true,
            values: [
              'Limpeza a Seco / Aspiração',
              'Lavagem Úmida Sanitizante',
              'Flushing Mecânico',
              'CIP (Clean-in-Place)',
              'Desincrustação Química',
            ],
            maxSelect: 1,
          },
          { name: 'produto_utilizado', type: 'text', required: false },
          { name: 'dosagem_diluicao', type: 'text', required: false },
          { name: 'frequencia', type: 'text', required: false }, // Diário, Por Batelada, Semanal, Mensal
          { name: 'tempo_contato', type: 'text', required: false },
          { name: 'criterio_aprovacao', type: 'text', required: false }, // ATP < 30 RLU, Visual sem resíduos
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_limp_mat_org ON limpeza_procedimentos_matriz (organization)',
          'CREATE INDEX idx_limp_mat_cod ON limpeza_procedimentos_matriz (codigo_procedimento)',
        ],
      })
      app.save(matrizCol)
    }

    // 8. Collection 'prevencao_contaminacao_cruzada' (Auto Controle 05 - Métodos por tema estruturados na IN 04/2007)
    let pccCol
    try {
      pccCol = app.findCollectionByNameOrId('prevencao_contaminacao_cruzada')
    } catch (_) {
      pccCol = new Collection({
        name: 'prevencao_contaminacao_cruzada',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'tema',
            type: 'select',
            required: true,
            values: [
              'qualificacao_fornecedores',
              'materias_primas',
              'limpeza_materiais_utensilios',
              'equipamentos',
              'limpeza_linha',
              'producao_ensaque',
            ],
            maxSelect: 1,
          },
          { name: 'titulo', type: 'text', required: true },
          { name: 'referencia_normativa', type: 'text', required: false }, // ex: IN 04/2007 Item 07 Subitem 7.5
          { name: 'metodo_procedimento', type: 'editor', required: true },
          { name: 'parametros_criticos', type: 'json', required: false },
          { name: 'pontos_inspecao', type: 'json', required: false },
          { name: 'acoes_corretivas_imediatas', type: 'text', required: false },
          { name: 'assinaturas', type: 'json', required: false }, // RT/RE e RQ
          { name: 'status_assinatura', type: 'text', required: false },
          { name: 'versao', type: 'text', required: false },
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_pcc_org ON prevencao_contaminacao_cruzada (organization)',
          'CREATE INDEX idx_pcc_tema ON prevencao_contaminacao_cruzada (tema)',
        ],
      })
      app.save(pccCol)
    }

    // 9. Collection 'convites_portal_fornecedor' (Tokens públicos para o pré-cadastro online POP 01-AC01)
    let convCol
    try {
      convCol = app.findCollectionByNameOrId('convites_portal_fornecedor')
    } catch (_) {
      convCol = new Collection({
        name: 'convites_portal_fornecedor',
        type: 'base',
        // Acesso público para visualização pelo token e preenchimento pelo fornecedor externo
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: '',
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'token', type: 'text', required: true },
          { name: 'fornecedor_cnpj', type: 'text', required: false },
          { name: 'fornecedor_nome', type: 'text', required: false },
          { name: 'fornecedor_email', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['PENDENTE', 'PREENCHIDO', 'VALIDADO_INTERNO', 'EXPIRADO'],
            maxSelect: 1,
          },
          { name: 'data_expiracao', type: 'date', required: false },
          { name: 'dados_pre_cadastro', type: 'json', required: false }, // CNPJ, contato, fone, email
          { name: 'respostas_questionario', type: 'json', required: false }, // seções 2, 3 e 4
          { name: 'auto_avaliacao_gerada_id', type: 'text', required: false },
          { name: 'criado_por_nome', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_conv_token ON convites_portal_fornecedor (token)',
          'CREATE INDEX idx_conv_org ON convites_portal_fornecedor (organization)',
          'CREATE INDEX idx_conv_status ON convites_portal_fornecedor (status)',
        ],
      })
      app.save(convCol)
    }

    // 10. Atualizar regras de 'auto_avaliacoes_fornecedor' para permitir submissão pública via portal
    try {
      const autoCol = app.findCollectionByNameOrId('auto_avaliacoes_fornecedor')
      // Permitir create se vier com status PENDENTE ou se autenticado
      autoCol.createRule = ''
      autoCol.viewRule = ''
      app.save(autoCol)
    } catch (e) {
      console.log('Erro ao ajustar rules de auto_avaliacoes_fornecedor:', e)
    }
  },
  (app) => {
    try {
      const convCol = app.findCollectionByNameOrId('convites_portal_fornecedor')
      app.delete(convCol)
    } catch (_) {}
    try {
      const pccCol = app.findCollectionByNameOrId('prevencao_contaminacao_cruzada')
      app.delete(pccCol)
    } catch (_) {}
    try {
      const matrizCol = app.findCollectionByNameOrId('limpeza_procedimentos_matriz')
      app.delete(matrizCol)
    } catch (_) {}
    try {
      const equipCol = app.findCollectionByNameOrId('limpeza_equipamentos')
      app.delete(equipCol)
    } catch (_) {}
    try {
      const prodCol = app.findCollectionByNameOrId('limpeza_produtos')
      app.delete(prodCol)
    } catch (_) {}
    try {
      const setCol = app.findCollectionByNameOrId('limpeza_setores')
      app.delete(setCol)
    } catch (_) {}
    try {
      const progCol = app.findCollectionByNameOrId('programacao_registros')
      app.delete(progCol)
    } catch (_) {}
  },
)
