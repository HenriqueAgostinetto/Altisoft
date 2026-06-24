// Henrique Agostinetto Piva
export type Role = 'ADMIN' | 'VENDAS' | 'SUPORTE';

export interface AuthUser {
  username: string;
  role: Role;
  access_token: string;
}

export interface Cliente {
  id: number;
  nome: string;
  segmento?: string;
  contato?: string;
  sistema_comprado?: string;
  maquinas_instaladas: number;
  status_cliente: string;
  prioridade_score: number;
  data_cadastro: string;
  deleted_at?: string | null;
}

export interface Transacao {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  produto: string;
  valor: number;
  data: string;
  status: string;
  deleted_at?: string | null;
}

export interface Ticket {
  id: number;
  cliente_id: number;
  cliente_nome?: string;
  assunto: string;
  urgencia: string;
  status: string;
  data_abertura: string;
  anexo_url?: string | null;
  deleted_at?: string | null;
}

export interface DashboardResumo {
  total_clientes: number;
  chamados_abertos: number;
  faturamento_restrito: boolean;
  faturamento_total?: number;
}

export interface AuditLog {
  id: number;
  username: string;
  role: string;
  action: string;
  entity: string;
  entity_id?: number;
  description: string;
  created_at: string;
}

export interface TrashItem {
  entity: string;
  id: number;
  label: string;
  deleted_at: string;
}

export interface UrgenciaResumo {
  urgencia: string;
  total: number;
}

export interface ClienteInteracao {
  id: number;
  cliente_id: number;
  tipo: string;
  descricao: string;
  created_at: string;
}

export interface ClienteTarefa {
  id: number;
  cliente_id: number;
  titulo: string;
  responsavel?: string;
  prazo?: string;
  status: string;
  created_at: string;
}

export interface ClienteDetalhe {
  cliente: Cliente;
  transacoes: Transacao[];
  tickets: Ticket[];
  interacoes: ClienteInteracao[];
  tarefas: ClienteTarefa[];
}
