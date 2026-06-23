# Altisoft CRM & Transacional

Sistema corporativo em arquitetura desacoplada:

- Backend: Python 3.11+, FastAPI, SQLAlchemy e PostgreSQL.
- Frontend: Angular 17+ com standalone components, RxJS e Tailwind CSS.
- Segurança: autenticação JWT simples e RBAC validado no backend.
- Governança: soft delete, lixeira administrativa e trilha de auditoria.
- Segurança operacional: rate limiting no login.
- BI: gráficos Chart.js alimentados pela API.
- Suporte: upload de anexos e notificações em tempo real via WebSocket.

O arquivo `altisoft-prototipo.html` foi preservado como protótipo inicial. A implementação modular está em `backend/` e `frontend/`.

## Estrutura

```txt
backend/
  app/
    auth.py        # JWT, hash de senha e dependências de RBAC
    database.py    # conexão PostgreSQL e sessão SQLAlchemy
    main.py        # endpoints REST protegidos
    models.py      # modelos SQLAlchemy e chaves estrangeiras
    schemas.py     # contratos Pydantic de entrada e saída
frontend/
  src/app/
    core/          # AuthService, ApiService, interceptor e guards
    layout/        # Sidebar responsiva por perfil
    pages/         # Login, Dashboard, CRM, Transações e Suporte
```

## Execução Local

1. Suba o PostgreSQL:

```bash
docker compose up -d
```

2. Configure o backend:

```bash
cd backend
copy .env.example .env
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

A API ficará em `http://localhost:8000`.
O Swagger ficará em `http://localhost:8000/docs`.

3. Configure o frontend:

```bash
cd frontend
npm install
npm start
```

O Angular ficará em `http://localhost:4200`.

## Usuários de Teste

O backend cria estes usuários automaticamente na inicialização:

| Perfil | Usuário | Senha |
| --- | --- | --- |
| Admin | `admin` | `admin123` |
| Vendas | `vendas` | `vendas123` |
| Suporte | `suporte` | `suporte123` |

## Regras RBAC

- Admin: acessa todos os módulos e endpoints financeiros.
- Vendas: acessa clientes e transações; dashboard recebe faturamento mascarado no resumo.
- Suporte: acessa tickets e dados operacionais de instalação; não acessa transações nem faturamento.

O Angular esconde menus para melhorar a experiência, mas isso não é segurança suficiente. A proteção real está no FastAPI, nas dependências `require_roles(...)` em `backend/app/auth.py`. Mesmo que alguém tente acessar `/api/dashboard/faturamento` manualmente com um token de Vendas ou Suporte, a API retorna `403`.

## Recursos Avançados

- Soft delete: `DELETE /api/clientes/{id}`, `DELETE /api/tickets/{id}` e `DELETE /api/transacoes/{id}` preenchem `deleted_at` em vez de apagar fisicamente.
- Lixeira: Admin acessa `/admin` no Angular e pode restaurar itens via `/api/admin/lixeira/{entity}/{id}/restaurar`.
- Auditoria: ações de login, criação, edição, venda, ticket, exclusão lógica e restauração são gravadas em `audit_logs`.
- Rate limiting: `/api/auth/login` bloqueia excesso de tentativas por IP.
- Relatórios CSV: `/api/relatorios/clientes.csv` e `/api/relatorios/transacoes.csv`.
- Upload de anexos: tickets aceitam `multipart/form-data` com campo `anexo`.
- Supabase Storage: se `SUPABASE_STORAGE_URL` e `SUPABASE_SERVICE_KEY` estiverem configurados, anexos são enviados ao bucket; sem credenciais, o backend salva localmente em `backend/uploads`.
- WebSocket: `/ws/notificacoes` envia toast em tempo real quando um ticket `CRITICA` é aberto.
- Gráficos: Dashboard usa Chart.js para evolução de vendas e distribuição de tickets por urgência.

## Integridade Referencial

As tabelas `transacoes` e `tickets` usam `cliente_id` como chave estrangeira para `clientes.id`. Isso impede que uma venda ou chamado seja gravado para um cliente inexistente. Essa regra pertence ao banco relacional e protege o sistema contra inconsistências mesmo se houver erro no frontend.

## Implantação

Backend:

1. Crie um PostgreSQL gerenciado, por exemplo Supabase, Neon, Railway, Render ou AWS RDS.
2. Configure `DATABASE_URL`, `JWT_SECRET_KEY` e `FRONTEND_ORIGIN` no ambiente de produção.
3. Publique o FastAPI em Render, Railway, Fly.io, Azure App Service ou similar.
4. Use `uvicorn app.main:app --host 0.0.0.0 --port $PORT` como comando de start.

Frontend:

1. Ajuste a URL da API em `frontend/src/app/core/auth.service.ts` e `frontend/src/app/core/api.service.ts`.
2. Rode `npm run build`.
3. Publique `frontend/dist/altisoft-frontend/browser` em Vercel, Netlify, Azure Static Web Apps ou servidor Nginx.

Em produção, substitua a criação automática de tabelas por migrations com Alembic e habilite HTTPS.
