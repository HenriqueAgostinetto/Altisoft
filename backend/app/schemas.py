from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from .models import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str
    role: UserRole


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: UserRole


class UserRead(BaseModel):
    id: int
    username: str
    role: UserRole

    model_config = ConfigDict(from_attributes=True)


class ClienteBase(BaseModel):
    nome: str = Field(min_length=2, max_length=160)
    segmento: str | None = None
    contato: str | None = None
    sistema_comprado: str | None = None
    maquinas_instaladas: int = Field(default=0, ge=0)
    status_cliente: str = "LEAD"
    prioridade_score: int = Field(default=50, ge=0, le=100)


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: str | None = None
    segmento: str | None = None
    contato: str | None = None
    sistema_comprado: str | None = None
    maquinas_instaladas: int | None = Field(default=None, ge=0)
    status_cliente: str | None = None
    prioridade_score: int | None = Field(default=None, ge=0, le=100)


class ClienteRead(ClienteBase):
    id: int
    data_cadastro: date
    deleted_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TransacaoBase(BaseModel):
    cliente_id: int
    produto: str = Field(min_length=2, max_length=140)
    valor: Decimal = Field(gt=0)
    data: date | None = None
    status: str = "PENDENTE"


class TransacaoCreate(TransacaoBase):
    pass


class TransacaoUpdate(BaseModel):
    produto: str | None = None
    valor: Decimal | None = Field(default=None, gt=0)
    data: date | None = None
    status: str | None = None


class TransacaoRead(BaseModel):
    id: int
    cliente_id: int
    cliente_nome: str | None = None
    produto: str
    valor: Decimal
    data: date
    status: str
    deleted_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class TicketBase(BaseModel):
    cliente_id: int
    assunto: str = Field(min_length=3, max_length=200)
    urgencia: str = "MEDIA"
    status: str = "ABERTO"


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    assunto: str | None = None
    urgencia: str | None = None
    status: str | None = None


class TicketRead(BaseModel):
    id: int
    cliente_id: int
    cliente_nome: str | None = None
    assunto: str
    urgencia: str
    status: str
    data_abertura: date
    anexo_url: str | None = None
    deleted_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class DashboardFaturamento(BaseModel):
    mes: str
    total: Decimal


class DashboardResumo(BaseModel):
    total_clientes: int
    chamados_abertos: int
    faturamento_restrito: bool
    faturamento_total: Decimal | None = None


class AuditLogRead(BaseModel):
    id: int
    username: str
    role: str
    action: str
    entity: str
    entity_id: int | None = None
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrashItem(BaseModel):
    entity: str
    id: int
    label: str
    deleted_at: datetime


class UrgenciaResumo(BaseModel):
    urgencia: str
    total: int


class ClienteInteracaoCreate(BaseModel):
    tipo: str = "NOTA"
    descricao: str = Field(min_length=3)


class ClienteInteracaoRead(BaseModel):
    id: int
    cliente_id: int
    tipo: str
    descricao: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClienteTarefaCreate(BaseModel):
    titulo: str = Field(min_length=3, max_length=160)
    responsavel: str | None = None
    prazo: date | None = None
    status: str = "PENDENTE"


class ClienteTarefaRead(BaseModel):
    id: int
    cliente_id: int
    titulo: str
    responsavel: str | None = None
    prazo: date | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClienteDetalhe(BaseModel):
    cliente: ClienteRead
    transacoes: list[TransacaoRead]
    tickets: list[TicketRead]
    interacoes: list[ClienteInteracaoRead]
    tarefas: list[ClienteTarefaRead]
