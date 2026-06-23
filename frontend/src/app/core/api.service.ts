import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuditLog, Cliente, ClienteDetalhe, ClienteInteracao, ClienteTarefa, DashboardResumo, Ticket, Transacao, TrashItem, UrgenciaResumo } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getResumo() {
    return this.http.get<DashboardResumo>(`${this.apiUrl}/dashboard/resumo`);
  }

  getFaturamento() {
    return this.http.get<{ mes: string; total: number }[]>(`${this.apiUrl}/dashboard/faturamento`);
  }

  getTicketsUrgencia() {
    return this.http.get<UrgenciaResumo[]>(`${this.apiUrl}/dashboard/tickets-urgencia`);
  }

  getClientes() {
    return this.http.get<Cliente[]>(`${this.apiUrl}/clientes`);
  }

  getClienteDetalhes(id: number) {
    return this.http.get<ClienteDetalhe>(`${this.apiUrl}/clientes/${id}/detalhes`);
  }

  createCliente(payload: Partial<Cliente>) {
    return this.http.post<Cliente>(`${this.apiUrl}/clientes`, payload);
  }

  updateCliente(id: number, payload: Partial<Cliente>) {
    return this.http.put<Cliente>(`${this.apiUrl}/clientes/${id}`, payload);
  }

  createInteracao(clienteId: number, payload: Partial<ClienteInteracao>) {
    return this.http.post<ClienteInteracao>(`${this.apiUrl}/clientes/${clienteId}/interacoes`, payload);
  }

  createTarefa(clienteId: number, payload: Partial<ClienteTarefa>) {
    return this.http.post<ClienteTarefa>(`${this.apiUrl}/clientes/${clienteId}/tarefas`, payload);
  }

  updateTarefa(id: number, payload: Partial<ClienteTarefa>) {
    return this.http.put<ClienteTarefa>(`${this.apiUrl}/clientes/tarefas/${id}`, payload);
  }

  deleteCliente(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/clientes/${id}`);
  }

  getTransacoes() {
    return this.http.get<Transacao[]>(`${this.apiUrl}/transacoes`);
  }

  createTransacao(payload: Partial<Transacao>) {
    return this.http.post<Transacao>(`${this.apiUrl}/transacoes`, payload);
  }

  deleteTransacao(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/transacoes/${id}`);
  }

  getTickets() {
    return this.http.get<Ticket[]>(`${this.apiUrl}/tickets`);
  }

  createTicket(payload: FormData) {
    return this.http.post<Ticket>(`${this.apiUrl}/tickets`, payload);
  }

  updateTicket(id: number, payload: Partial<Ticket>) {
    return this.http.put<Ticket>(`${this.apiUrl}/tickets/${id}`, payload);
  }

  deleteTicket(id: number) {
    return this.http.delete<void>(`${this.apiUrl}/tickets/${id}`);
  }

  getAuditoria() {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/admin/auditoria`);
  }

  getLixeira() {
    return this.http.get<TrashItem[]>(`${this.apiUrl}/admin/lixeira`);
  }

  restaurarItem(entity: string, id: number) {
    return this.http.post<{ message: string }>(`${this.apiUrl}/admin/lixeira/${entity}/${id}/restaurar`, {});
  }

  exportClientes() {
    return this.http.get(`${this.apiUrl}/relatorios/clientes.csv`, { responseType: 'blob' });
  }

  exportTransacoes() {
    return this.http.get(`${this.apiUrl}/relatorios/transacoes.csv`, { responseType: 'blob' });
  }
}
