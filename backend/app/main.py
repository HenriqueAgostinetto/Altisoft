import csv
import io
import time
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Annotated

import httpx
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import extract, func, text
from sqlalchemy.orm import Session

from .auth import create_access_token, get_current_user, hash_password, require_roles, verify_password
from .database import Base, engine, get_db, settings
from .models import AuditLog, Cliente, ClienteInteracao, ClienteTarefa, Ticket, Transacao, User, UserRole
from .schemas import (
    AuditLogRead,
    ClienteCreate,
    ClienteDetalhe,
    ClienteInteracaoCreate,
    ClienteInteracaoRead,
    ClienteRead,
    ClienteTarefaCreate,
    ClienteTarefaRead,
    ClienteUpdate,
    DashboardFaturamento,
    DashboardResumo,
    LoginRequest,
    TicketCreate,
    TicketRead,
    TicketUpdate,
    TokenResponse,
    TrashItem,
    TransacaoCreate,
    TransacaoRead,
    TransacaoUpdate,
    UrgenciaResumo,
)

app = FastAPI(title="Altisoft API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:4200", "http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

login_attempts: dict[str, list[float]] = {}


@app.middleware("http")
async def login_rate_limit(request: Request, call_next):
    if request.url.path == "/api/auth/login" and request.method == "POST":
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        recent = [stamp for stamp in login_attempts.get(client_ip, []) if now - stamp < 60]
        if len(recent) >= 10:
            return JSONResponse(status_code=429, content={"detail": "Muitas tentativas de login. Aguarde um minuto."})
        recent.append(now)
        login_attempts[client_ip] = recent
    return await call_next(request)


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except RuntimeError:
                self.disconnect(connection)


ws_manager = ConnectionManager()


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_schema_upgrades()
    seed_default_users()


def ensure_schema_upgrades() -> None:
    statements = [
        "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS status_cliente VARCHAR(40) DEFAULT 'LEAD'",
        "ALTER TABLE clientes ADD COLUMN IF NOT EXISTS prioridade_score INTEGER DEFAULT 50",
        "UPDATE clientes SET status_cliente = 'LEAD' WHERE status_cliente IS NULL",
        "UPDATE clientes SET prioridade_score = 50 WHERE prioridade_score IS NULL",
        "ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS anexo_url VARCHAR(500)",
    ]
    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))


def add_audit(db: Session, user: User, action: str, entity: str, entity_id: int | None, description: str) -> None:
    db.add(AuditLog(username=user.username, role=user.role.value, action=action, entity=entity, entity_id=entity_id, description=description))


def seed_default_users() -> None:
    db = next(get_db())
    try:
        defaults = [
            ("admin", "admin123", UserRole.ADMIN),
            ("vendas", "vendas123", UserRole.VENDAS),
            ("suporte", "suporte123", UserRole.SUPORTE),
        ]
        for username, password, role in defaults:
            if not db.query(User).filter(User.username == username).first():
                db.add(User(username=username, password_hash=hash_password(password), role=role))
        db.commit()
    finally:
        db.close()


def transacao_to_schema(item: Transacao) -> TransacaoRead:
    return TransacaoRead(
        id=item.id,
        cliente_id=item.cliente_id,
        cliente_nome=item.cliente.nome if item.cliente else None,
        produto=item.produto,
        valor=item.valor,
        data=item.data,
        status=item.status,
        deleted_at=item.deleted_at,
    )


def ticket_to_schema(item: Ticket) -> TicketRead:
    return TicketRead(
        id=item.id,
        cliente_id=item.cliente_id,
        cliente_nome=item.cliente.nome if item.cliente else None,
        assunto=item.assunto,
        urgencia=item.urgencia,
        status=item.status,
        data_abertura=item.data_abertura,
        anexo_url=item.anexo_url,
        deleted_at=item.deleted_at,
    )


@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    user = db.query(User).filter(User.username == payload.username, User.role == payload.role).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais invalidas")
    token = create_access_token(subject=user.username, role=user.role)
    add_audit(db, user, "LOGIN", "User", user.id, f"Usuário '{user.username}' acessou o sistema")
    db.commit()
    return TokenResponse(access_token=token, username=user.username, role=user.role)


@app.get("/api/dashboard/resumo", response_model=DashboardResumo)
def dashboard_resumo(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> DashboardResumo:
    total_clientes = db.query(func.count(Cliente.id)).filter(Cliente.deleted_at.is_(None)).scalar() or 0
    chamados_abertos = db.query(func.count(Ticket.id)).filter(Ticket.status != "RESOLVIDO", Ticket.deleted_at.is_(None)).scalar() or 0
    if user.role == UserRole.ADMIN:
        total = db.query(func.coalesce(func.sum(Transacao.valor), 0)).filter(Transacao.deleted_at.is_(None)).scalar() or Decimal("0")
        return DashboardResumo(total_clientes=total_clientes, chamados_abertos=chamados_abertos, faturamento_restrito=False, faturamento_total=total)
    return DashboardResumo(total_clientes=total_clientes, chamados_abertos=chamados_abertos, faturamento_restrito=True)


@app.get("/api/dashboard/faturamento", response_model=list[DashboardFaturamento])
def faturamento_mensal(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> list[DashboardFaturamento]:
    rows = (
        db.query(extract("month", Transacao.data).label("mes"), func.sum(Transacao.valor).label("total"))
        .filter(Transacao.deleted_at.is_(None))
        .group_by("mes")
        .order_by("mes")
        .all()
    )
    return [DashboardFaturamento(mes=f"{int(row.mes):02d}", total=row.total or Decimal("0")) for row in rows]


@app.get("/api/clientes", response_model=list[ClienteRead])
def listar_clientes(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS, UserRole.SUPORTE))],
) -> list[Cliente]:
    return db.query(Cliente).filter(Cliente.deleted_at.is_(None)).order_by(Cliente.data_cadastro.desc()).all()


@app.get("/api/clientes/{cliente_id}/detalhes", response_model=ClienteDetalhe)
def detalhes_cliente(
    cliente_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS, UserRole.SUPORTE))],
) -> ClienteDetalhe:
    cliente = db.get(Cliente, cliente_id)
    if not cliente or cliente.deleted_at:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    transacoes = [transacao_to_schema(item) for item in db.query(Transacao).filter(Transacao.cliente_id == cliente_id, Transacao.deleted_at.is_(None)).order_by(Transacao.data.desc()).all()]
    tickets = [ticket_to_schema(item) for item in db.query(Ticket).filter(Ticket.cliente_id == cliente_id, Ticket.deleted_at.is_(None)).order_by(Ticket.data_abertura.desc()).all()]
    interacoes = db.query(ClienteInteracao).filter(ClienteInteracao.cliente_id == cliente_id).order_by(ClienteInteracao.created_at.desc()).all()
    tarefas = db.query(ClienteTarefa).filter(ClienteTarefa.cliente_id == cliente_id).order_by(ClienteTarefa.created_at.desc()).all()
    return ClienteDetalhe(cliente=cliente, transacoes=transacoes, tickets=tickets, interacoes=interacoes, tarefas=tarefas)


@app.post("/api/clientes/{cliente_id}/interacoes", response_model=ClienteInteracaoRead, status_code=status.HTTP_201_CREATED)
def criar_interacao_cliente(
    cliente_id: int,
    payload: ClienteInteracaoCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> ClienteInteracao:
    cliente = db.get(Cliente, cliente_id)
    if not cliente or cliente.deleted_at:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    interacao = ClienteInteracao(cliente_id=cliente_id, **payload.model_dump())
    db.add(interacao)
    db.flush()
    add_audit(db, user, "CREATE", "ClienteInteracao", interacao.id, f"Usuário '{user.username}' registrou interação no cliente '{cliente.nome}'")
    db.commit()
    db.refresh(interacao)
    return interacao


@app.post("/api/clientes/{cliente_id}/tarefas", response_model=ClienteTarefaRead, status_code=status.HTTP_201_CREATED)
def criar_tarefa_cliente(
    cliente_id: int,
    payload: ClienteTarefaCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> ClienteTarefa:
    cliente = db.get(Cliente, cliente_id)
    if not cliente or cliente.deleted_at:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    tarefa = ClienteTarefa(cliente_id=cliente_id, **payload.model_dump())
    db.add(tarefa)
    db.flush()
    add_audit(db, user, "CREATE", "ClienteTarefa", tarefa.id, f"Usuário '{user.username}' criou tarefa para o cliente '{cliente.nome}'")
    db.commit()
    db.refresh(tarefa)
    return tarefa


@app.put("/api/clientes/tarefas/{tarefa_id}", response_model=ClienteTarefaRead)
def atualizar_tarefa_cliente(
    tarefa_id: int,
    payload: ClienteTarefaCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> ClienteTarefa:
    tarefa = db.get(ClienteTarefa, tarefa_id)
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa nao encontrada")
    for key, value in payload.model_dump().items():
        setattr(tarefa, key, value)
    add_audit(db, user, "UPDATE", "ClienteTarefa", tarefa.id, f"Usuário '{user.username}' atualizou tarefa de CRM")
    db.commit()
    db.refresh(tarefa)
    return tarefa


@app.post("/api/clientes", response_model=ClienteRead, status_code=status.HTTP_201_CREATED)
def criar_cliente(
    payload: ClienteCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> Cliente:
    cliente = Cliente(**payload.model_dump(), data_cadastro=date.today())
    db.add(cliente)
    db.flush()
    add_audit(db, user, "CREATE", "Cliente", cliente.id, f"Usuário '{user.username}' criou o cliente '{cliente.nome}'")
    db.commit()
    db.refresh(cliente)
    return cliente


@app.put("/api/clientes/{cliente_id}", response_model=ClienteRead)
def atualizar_cliente(
    cliente_id: int,
    payload: ClienteUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> Cliente:
    cliente = db.get(Cliente, cliente_id)
    if not cliente or cliente.deleted_at:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(cliente, key, value)
    add_audit(db, user, "UPDATE", "Cliente", cliente.id, f"Usuário '{user.username}' atualizou o cliente '{cliente.nome}'")
    db.commit()
    db.refresh(cliente)
    return cliente


@app.delete("/api/clientes/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_cliente(
    cliente_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> None:
    cliente = db.get(Cliente, cliente_id)
    if not cliente or cliente.deleted_at:
        raise HTTPException(status_code=404, detail="Cliente nao encontrado")
    cliente.deleted_at = datetime.now(timezone.utc)
    add_audit(db, user, "SOFT_DELETE", "Cliente", cliente.id, f"Usuário '{user.username}' enviou o cliente '{cliente.nome}' para a lixeira")
    db.commit()


@app.get("/api/transacoes", response_model=list[TransacaoRead])
def listar_transacoes(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> list[TransacaoRead]:
    return [transacao_to_schema(item) for item in db.query(Transacao).filter(Transacao.deleted_at.is_(None)).order_by(Transacao.data.desc()).all()]


@app.post("/api/transacoes", response_model=TransacaoRead, status_code=status.HTTP_201_CREATED)
def criar_transacao(
    payload: TransacaoCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> TransacaoRead:
    cliente = db.get(Cliente, payload.cliente_id)
    if not cliente or cliente.deleted_at:
        raise HTTPException(status_code=400, detail="cliente_id nao existe; integridade referencial bloqueia a venda")
    values = payload.model_dump(exclude={"data"})
    transacao = Transacao(**values, data=payload.data or date.today())
    db.add(transacao)
    db.flush()
    add_audit(db, user, "CREATE", "Transacao", transacao.id, f"Usuário '{user.username}' registrou venda de {transacao.produto} para '{cliente.nome}'")
    db.commit()
    db.refresh(transacao)
    return transacao_to_schema(transacao)


@app.delete("/api/transacoes/{transacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_transacao(
    transacao_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> None:
    transacao = db.get(Transacao, transacao_id)
    if not transacao or transacao.deleted_at:
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    transacao.deleted_at = datetime.now(timezone.utc)
    add_audit(db, user, "SOFT_DELETE", "Transacao", transacao.id, f"Usuário '{user.username}' enviou uma transação para a lixeira")
    db.commit()


@app.put("/api/transacoes/{transacao_id}", response_model=TransacaoRead)
def atualizar_transacao(
    transacao_id: int,
    payload: TransacaoUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
) -> TransacaoRead:
    transacao = db.get(Transacao, transacao_id)
    if not transacao or transacao.deleted_at:
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(transacao, key, value)
    add_audit(db, user, "UPDATE", "Transacao", transacao.id, f"Usuário '{user.username}' atualizou uma transação")
    db.commit()
    db.refresh(transacao)
    return transacao_to_schema(transacao)


@app.get("/api/tickets", response_model=list[TicketRead])
def listar_tickets(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPORTE))],
) -> list[TicketRead]:
    return [ticket_to_schema(item) for item in db.query(Ticket).filter(Ticket.deleted_at.is_(None)).order_by(Ticket.data_abertura.desc()).all()]


@app.post("/api/tickets", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
async def criar_ticket(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPORTE))],
    cliente_id: int = Form(...),
    assunto: str = Form(...),
    urgencia: str = Form("MEDIA"),
    status_value: str = Form("ABERTO", alias="status"),
    anexo: UploadFile | None = File(default=None),
) -> TicketRead:
    cliente = db.get(Cliente, cliente_id)
    if not cliente or cliente.deleted_at:
        raise HTTPException(status_code=400, detail="cliente_id nao existe; ticket precisa pertencer a um cliente real")
    anexo_url = await save_ticket_attachment(anexo) if anexo else None
    ticket = Ticket(cliente_id=cliente_id, assunto=assunto, urgencia=urgencia, status=status_value, anexo_url=anexo_url, data_abertura=date.today())
    db.add(ticket)
    db.flush()
    add_audit(db, user, "CREATE", "Ticket", ticket.id, f"Usuário '{user.username}' abriu ticket '{ticket.assunto}' para '{cliente.nome}'")
    db.commit()
    db.refresh(ticket)
    result = ticket_to_schema(ticket)
    if urgencia.upper() in {"CRITICA", "CRÍTICA"}:
        await ws_manager.broadcast({"type": "critical_ticket", "message": f"Atenção: Novo ticket crítico aberto para o Cliente {cliente.nome}!"})
    return result


@app.put("/api/tickets/{ticket_id}", response_model=TicketRead)
def atualizar_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPORTE))],
) -> TicketRead:
    ticket = db.get(Ticket, ticket_id)
    if not ticket or ticket.deleted_at:
        raise HTTPException(status_code=404, detail="Ticket nao encontrado")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, key, value)
    add_audit(db, user, "UPDATE", "Ticket", ticket.id, f"Usuário '{user.username}' atualizou o ticket '{ticket.assunto}'")
    db.commit()
    db.refresh(ticket)
    return ticket_to_schema(ticket)


@app.delete("/api/tickets/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_ticket(
    ticket_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPORTE))],
) -> None:
    ticket = db.get(Ticket, ticket_id)
    if not ticket or ticket.deleted_at:
        raise HTTPException(status_code=404, detail="Ticket nao encontrado")
    ticket.deleted_at = datetime.now(timezone.utc)
    add_audit(db, user, "SOFT_DELETE", "Ticket", ticket.id, f"Usuário '{user.username}' enviou o ticket '{ticket.assunto}' para a lixeira")
    db.commit()


async def save_ticket_attachment(file: UploadFile) -> str:
    content = await file.read()
    safe_name = f"{int(time.time())}_{file.filename.replace(' ', '_')}"
    if settings.supabase_storage_url and settings.supabase_service_key:
        url = f"{settings.supabase_storage_url.rstrip('/')}/storage/v1/object/{settings.supabase_bucket}/{safe_name}"
        headers = {"Authorization": f"Bearer {settings.supabase_service_key}", "Content-Type": file.content_type or "application/octet-stream"}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(url, headers=headers, content=content)
            response.raise_for_status()
        return f"{settings.supabase_storage_url.rstrip('/')}/storage/v1/object/public/{settings.supabase_bucket}/{safe_name}"

    target = UPLOAD_DIR / safe_name
    target.write_bytes(content)
    return f"http://127.0.0.1:8000/uploads/{safe_name}"


@app.get("/api/admin/auditoria", response_model=list[AuditLogRead])
def listar_auditoria(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> list[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()


@app.get("/api/admin/lixeira", response_model=list[TrashItem])
def listar_lixeira(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> list[TrashItem]:
    items: list[TrashItem] = []
    for cliente in db.query(Cliente).filter(Cliente.deleted_at.is_not(None)).all():
        items.append(TrashItem(entity="clientes", id=cliente.id, label=cliente.nome, deleted_at=cliente.deleted_at))
    for ticket in db.query(Ticket).filter(Ticket.deleted_at.is_not(None)).all():
        items.append(TrashItem(entity="tickets", id=ticket.id, label=ticket.assunto, deleted_at=ticket.deleted_at))
    for transacao in db.query(Transacao).filter(Transacao.deleted_at.is_not(None)).all():
        items.append(TrashItem(entity="transacoes", id=transacao.id, label=transacao.produto, deleted_at=transacao.deleted_at))
    return sorted(items, key=lambda item: item.deleted_at, reverse=True)


@app.post("/api/admin/lixeira/{entity}/{entity_id}/restaurar")
def restaurar_item(
    entity: str,
    entity_id: int,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
) -> dict[str, str]:
    models = {"clientes": Cliente, "tickets": Ticket, "transacoes": Transacao}
    model = models.get(entity)
    if not model:
        raise HTTPException(status_code=404, detail="Tipo de item invalido")
    item = db.get(model, entity_id)
    if not item or not item.deleted_at:
        raise HTTPException(status_code=404, detail="Item nao encontrado na lixeira")
    item.deleted_at = None
    add_audit(db, user, "RESTORE", entity, entity_id, f"Usuário '{user.username}' restaurou item de {entity}")
    db.commit()
    return {"message": "Item restaurado com sucesso"}


@app.get("/api/relatorios/clientes.csv")
def exportar_clientes(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "nome", "segmento", "contato", "sistema_comprado", "maquinas_instaladas", "status_cliente", "prioridade_score", "data_cadastro"])
    for cliente in db.query(Cliente).filter(Cliente.deleted_at.is_(None)).order_by(Cliente.nome).all():
        writer.writerow([cliente.id, cliente.nome, cliente.segmento, cliente.contato, cliente.sistema_comprado, cliente.maquinas_instaladas, cliente.status_cliente, cliente.prioridade_score, cliente.data_cadastro])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=clientes_altisoft.csv"})


@app.get("/api/relatorios/transacoes.csv")
def exportar_transacoes(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.VENDAS))],
):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "cliente", "produto", "valor", "data", "status"])
    for item in db.query(Transacao).filter(Transacao.deleted_at.is_(None)).order_by(Transacao.data.desc()).all():
        writer.writerow([item.id, item.cliente.nome if item.cliente else "", item.produto, item.valor, item.data, item.status])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=transacoes_altisoft.csv"})


@app.get("/api/dashboard/tickets-urgencia", response_model=list[UrgenciaResumo])
def tickets_por_urgencia(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPORTE))],
) -> list[UrgenciaResumo]:
    rows = db.query(Ticket.urgencia, func.count(Ticket.id)).filter(Ticket.deleted_at.is_(None)).group_by(Ticket.urgencia).all()
    return [UrgenciaResumo(urgencia=row[0], total=row[1]) for row in rows]


@app.websocket("/ws/notificacoes")
async def websocket_notificacoes(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
