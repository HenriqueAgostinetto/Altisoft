// Henrique Agostinetto Piva
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Cliente, Ticket } from '../../core/models';

@Component({
  selector: 'app-suporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-950">Suporte Tecnico</h1>
          <p class="text-sm text-slate-500">Tickets com anexos, auditoria e notificacao em tempo real para urgencia critica.</p>
        </div>
        <button (click)="showForm = !showForm" class="btn-primary">Abrir Ticket</button>
      </div>

      <div class="insight-panel mt-5">
        <strong>Central tecnica</strong>
        <p class="mt-1">Gestao de chamados, anexos de evidencias e acompanhamento operacional dos clientes em implantacao ou suporte ativo.</p>
      </div>

      <div class="mt-5 flex gap-2">
        <button (click)="tab='tickets'" [class.bg-brand-900]="tab==='tickets'" [class.text-white]="tab==='tickets'" class="btn-secondary">Chamados Ativos</button>
        <button (click)="tab='clientes'" [class.bg-brand-900]="tab==='clientes'" [class.text-white]="tab==='clientes'" class="btn-secondary">Novos Clientes</button>
      </div>

      <form *ngIf="showForm" (ngSubmit)="create()" class="card soft-pop mt-5 grid gap-4 md:grid-cols-2">
        <select [(ngModel)]="form.cliente_id" name="cliente" class="rounded-md border border-slate-300 px-3 py-2" required>
          <option [ngValue]="undefined">Selecione o cliente</option>
          <option *ngFor="let cliente of clientes" [ngValue]="cliente.id">{{ cliente.nome }}</option>
        </select>
        <input [(ngModel)]="form.assunto" name="assunto" placeholder="Assunto" class="rounded-md border border-slate-300 px-3 py-2" required>
        <select [(ngModel)]="form.urgencia" name="urgencia" class="rounded-md border border-slate-300 px-3 py-2">
          <option>BAIXA</option><option>MEDIA</option><option>ALTA</option><option>CRITICA</option>
        </select>
        <select [(ngModel)]="form.status" name="status" class="rounded-md border border-slate-300 px-3 py-2">
          <option>ABERTO</option><option>EM_ATENDIMENTO</option><option>RESOLVIDO</option>
        </select>
        <label class="md:col-span-2">
          <span class="text-sm font-bold text-slate-600">Anexo de erro (print opcional)</span>
          <input type="file" accept="image/*" (change)="onFile($event)" class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2">
        </label>
        <button class="btn-primary md:col-span-2">Salvar Ticket</button>
      </form>

      <div *ngIf="tab === 'tickets'" class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
            <tr><th class="px-4 py-3">Cliente</th><th class="px-4 py-3">Assunto</th><th class="px-4 py-3">Urgencia</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Anexo</th><th class="px-4 py-3">Acao</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let ticket of tickets">
              <td class="px-4 py-3 font-semibold">{{ ticket.cliente_nome }}</td>
              <td class="px-4 py-3">{{ ticket.assunto }}</td>
              <td class="px-4 py-3">{{ ticket.urgencia }}</td>
              <td class="px-4 py-3">{{ ticket.status }}</td>
              <td class="px-4 py-3"><a *ngIf="ticket.anexo_url" [href]="ticket.anexo_url" target="_blank" class="font-bold text-brand-900">Abrir</a></td>
              <td class="px-4 py-3 flex gap-2">
                <button (click)="resolve(ticket)" class="btn-secondary">Resolver</button>
                <button (click)="delete(ticket)" class="rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="tab === 'clientes'" class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article *ngFor="let cliente of clientes" class="card">
          <h2 class="font-extrabold">{{ cliente.nome }}</h2>
          <p class="mt-2 text-sm"><strong>Sistema:</strong> {{ cliente.sistema_comprado || '-' }}</p>
          <p class="text-sm"><strong>Maquinas instaladas:</strong> {{ cliente.maquinas_instaladas }}</p>
        </article>
      </div>
    </section>
  `
})
export class SuporteComponent implements OnInit {
  clientes: Cliente[] = [];
  tickets: Ticket[] = [];
  tab: 'tickets' | 'clientes' = 'tickets';
  showForm = false;
  form: Partial<Ticket> = { urgencia: 'MEDIA', status: 'ABERTO' };
  selectedFile?: File;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
    this.loadTickets();
  }

  loadTickets(): void {
    this.api.getTickets().subscribe((tickets) => this.tickets = tickets);
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0];
  }

  create(): void {
    const data = new FormData();
    data.append('cliente_id', String(this.form.cliente_id));
    data.append('assunto', this.form.assunto || '');
    data.append('urgencia', this.form.urgencia || 'MEDIA');
    data.append('status', this.form.status || 'ABERTO');
    if (this.selectedFile) {
      data.append('anexo', this.selectedFile);
    }

    this.api.createTicket(data).subscribe(() => {
      this.form = { urgencia: 'MEDIA', status: 'ABERTO' };
      this.selectedFile = undefined;
      this.showForm = false;
      this.loadTickets();
    });
  }

  resolve(ticket: Ticket): void {
    this.api.updateTicket(ticket.id, { status: 'RESOLVIDO' }).subscribe(() => this.loadTickets());
  }

  delete(ticket: Ticket): void {
    this.api.deleteTicket(ticket.id).subscribe(() => this.loadTickets());
  }
}
