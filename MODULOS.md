# Modulos do Sistema Altisoft

Este documento explica o que cada modulo do sistema faz e qual problema ele resolve dentro de uma empresa.

## Visao Geral

O Altisoft e uma plataforma corporativa para integrar relacionamento com clientes, vendas, suporte tecnico, contratos, indicadores gerenciais e governanca de dados.

O sistema trabalha com tres perfis principais:

- **Administrador:** acesso completo, indicadores financeiros, governanca, auditoria e lixeira.
- **Vendas:** acesso aos modulos comerciais, CRM, pipeline, propostas, agenda, contratos e transacoes.
- **Suporte:** acesso aos chamados, SLA, inventario tecnico e base de conhecimento.

## Modulos Principais

### Login e Controle de Acesso

Permite entrar no sistema usando perfis diferentes. Cada perfil visualiza apenas os menus e funcionalidades autorizados.

Contas de teste:

| Perfil | Usuario | Senha |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Vendas | `vendas` | `vendas123` |
| Suporte | `suporte` | `suporte123` |

### Dashboard Gerencial

Apresenta indicadores consolidados da operacao:

- Total de clientes cadastrados.
- Chamados em aberto.
- Faturamento total, visivel apenas para Admin.
- Grafico de evolucao de vendas.
- Grafico de chamados por urgencia.
- Card institucional "Altisoft Intelligence".

### CRM Clientes

Modulo de relacionamento com clientes.

Permite:

- Cadastrar clientes.
- Consultar clientes por nome, contato, status ou segmento.
- Controlar status do cliente: `LEAD`, `NEGOCIACAO`, `ATIVO`, `IMPLANTACAO`, `INATIVO`.
- Definir score de prioridade comercial.
- Ver detalhes do cliente.
- Registrar historico de interacoes.
- Criar tarefas comerciais.
- Visualizar vendas relacionadas.
- Visualizar tickets relacionados.
- Exportar relatorio CSV de clientes.

### Pipeline Comercial

Organiza clientes por etapa do funil comercial:

- Leads novos.
- Clientes em negociacao.
- Clientes em implantacao.
- Clientes ativos.
- Contas inativas que podem ser reativadas.

### Propostas Comerciais

Simula propostas para empresas com base nos dados do cliente:

- Sistema contratado.
- Quantidade de maquinas/licencas.
- Valor estimado de setup.
- Mensalidade estimada.
- Botao de geracao de proposta.

### Agenda e Follow-up

Organiza proximas acoes comerciais por prioridade.

Exemplos:

- Qualificar oportunidade.
- Enviar proposta revisada.
- Agendar treinamento.
- Fazer contato de sucesso do cliente.
- Reativar relacionamento.

### Contratos e Renovacoes

Controla contratos empresariais e riscos comerciais:

- Plano/sistema contratado.
- MRR estimado.
- Data estimada de renovacao.
- Classificacao de risco: baixo, medio ou alto.

### Transacoes / Vendas

Registra vendas vinculadas a clientes reais:

- Cadastro de transacoes.
- Produto vendido.
- Valor.
- Status da venda.
- Cliente relacionado.
- Exportacao de relatorio CSV.

Este modulo demonstra integridade referencial, pois uma venda precisa estar vinculada a um cliente existente.

### Suporte Tecnico / Chamados

Central de atendimento para tickets de suporte:

- Abrir chamados.
- Classificar urgencia.
- Alterar status.
- Anexar imagem ou print do erro.
- Marcar ticket como resolvido.
- Enviar tickets para a lixeira por exclusao logica.

Tickets criticos disparam notificacoes em tempo real via WebSocket.

### SLA e Prioridades

Painel de acompanhamento de atendimento tecnico:

- Chamados abertos.
- Chamados criticos.
- Chamados em atendimento.
- Chamados resolvidos.
- Lista de tickets com urgencia e status.

### Inventario de Instalacoes

Visao operacional dos sistemas instalados nos clientes:

- Cliente.
- Sistema comprado.
- Quantidade de maquinas instaladas.
- Tipo de ambiente tecnico.

Esse modulo ajuda o suporte a entender rapidamente a estrutura instalada em cada empresa.

### Base de Conhecimento

Area com procedimentos internos para padronizar o atendimento:

- Checklist de instalacao ERP.
- Triagem de erro fiscal.
- Roteiro de onboarding.
- Reset de credenciais.
- Backup e restauracao.
- Passagem do comercial para sucesso do cliente.

### Governanca

Modulo administrativo para controle e rastreabilidade:

- **Lixeira:** exibe itens excluidos logicamente.
- **Restauracao:** permite recuperar clientes, tickets ou transacoes.
- **Auditoria:** registra acoes importantes do sistema.

Eventos auditados:

- Login.
- Criacao de cliente.
- Criacao de venda.
- Abertura de ticket.
- Edicao de registros.
- Exclusao logica.
- Restauracao de itens.

## Recursos Tecnicos Demonstrados

- Arquitetura desacoplada entre frontend e backend.
- Frontend em Angular.
- Backend em FastAPI.
- Banco relacional PostgreSQL.
- SQLAlchemy como ORM.
- Autenticacao JWT.
- RBAC por perfil.
- Integridade referencial com chaves estrangeiras.
- Soft delete com `deleted_at`.
- Audit log.
- Rate limiting no login.
- Upload de anexos.
- WebSocket para notificacoes em tempo real.
- Exportacao de relatorios CSV.
- Graficos dinamicos com Chart.js.

## Objetivo Academico

O projeto demonstra como um sistema de informacao empresarial pode integrar processos de diferentes areas da empresa: comercial, suporte, gestao, governanca e seguranca.

Ele tambem mostra conceitos importantes como controle de acesso, banco de dados relacional, rastreabilidade, integridade referencial, separacao entre frontend e backend e apoio a tomada de decisao.
