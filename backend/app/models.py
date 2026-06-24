# Henrique Agostinetto Piva
from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Optional

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    VENDAS = "VENDAS"
    SUPORTE = "SUPORTE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), index=True)


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(160), index=True)
    segmento: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    contato: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    sistema_comprado: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    maquinas_instaladas: Mapped[int] = mapped_column(Integer, default=0)
    status_cliente: Mapped[str] = mapped_column(String(40), default="LEAD")
    prioridade_score: Mapped[int] = mapped_column(Integer, default=50)
    data_cadastro: Mapped[date] = mapped_column(Date, default=date.today)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Integridade referencial: se uma transacao/ticket aponta para cliente_id,
    # o PostgreSQL garante que esse cliente exista antes da gravacao.
    transacoes: Mapped[list["Transacao"]] = relationship(back_populates="cliente")
    tickets: Mapped[list["Ticket"]] = relationship(back_populates="cliente")
    interacoes: Mapped[list["ClienteInteracao"]] = relationship(back_populates="cliente")
    tarefas: Mapped[list["ClienteTarefa"]] = relationship(back_populates="cliente")


class ClienteInteracao(Base):
    __tablename__ = "cliente_interacoes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id", ondelete="RESTRICT"), index=True)
    tipo: Mapped[str] = mapped_column(String(60), default="NOTA")
    descricao: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    cliente: Mapped[Cliente] = relationship(back_populates="interacoes")


class ClienteTarefa(Base):
    __tablename__ = "cliente_tarefas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id", ondelete="RESTRICT"), index=True)
    titulo: Mapped[str] = mapped_column(String(160))
    responsavel: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    prazo: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="PENDENTE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    cliente: Mapped[Cliente] = relationship(back_populates="tarefas")


class Transacao(Base):
    __tablename__ = "transacoes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id", ondelete="RESTRICT"), index=True)
    produto: Mapped[str] = mapped_column(String(140))
    valor: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    data: Mapped[date] = mapped_column(Date, default=date.today)
    status: Mapped[str] = mapped_column(String(40), default="PENDENTE")
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    cliente: Mapped[Cliente] = relationship(back_populates="transacoes")


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id", ondelete="RESTRICT"), index=True)
    assunto: Mapped[str] = mapped_column(String(200))
    urgencia: Mapped[str] = mapped_column(String(40), default="MEDIA")
    status: Mapped[str] = mapped_column(String(40), default="ABERTO")
    data_abertura: Mapped[date] = mapped_column(Date, default=date.today)
    anexo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    deleted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    cliente: Mapped[Cliente] = relationship(back_populates="tickets")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(80), index=True)
    role: Mapped[str] = mapped_column(String(30), index=True)
    action: Mapped[str] = mapped_column(String(80), index=True)
    entity: Mapped[str] = mapped_column(String(80), index=True)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
