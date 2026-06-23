import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Ticket } from '../../core/models';

@Component({
  selector: 'app-sla',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">SLA e Prioridades</h1>
      <p class="text-sm text-slate-500">Monitoramento de chamados por urgência e status.</p>

      <div class="mt-6 grid gap-4 md:grid-cols-4">
        <article class="card"><p class="text-xs font-bold uppercase text-slate-500">Abertos</p><p class="mt-2 text-3xl font-extrabold">{{ abertos }}</p></article>
        <article class="card"><p class="text-xs font-bold uppercase text-slate-500">Criticos</p><p class="mt-2 text-3xl font-extrabold text-red-700">{{ criticos }}</p></article>
        <article class="card"><p class="text-xs font-bold uppercase text-slate-500">Em atendimento</p><p class="mt-2 text-3xl font-extrabold">{{ emAtendimento }}</p></article>
        <article class="card"><p class="text-xs font-bold uppercase text-slate-500">Resolvidos</p><p class="mt-2 text-3xl font-extrabold text-emerald-700">{{ resolvidos }}</p></article>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-2">
        <article *ngFor="let ticket of tickets" class="card">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-extrabold">{{ ticket.assunto }}</h2>
              <p class="text-sm text-slate-500">{{ ticket.cliente_nome }}</p>
            </div>
            <span class="rounded-md px-2 py-1 text-xs font-bold" [ngClass]="urgenciaClass(ticket.urgencia)">{{ ticket.urgencia }}</span>
          </div>
          <p class="mt-4 text-sm">Status: <strong>{{ ticket.status }}</strong></p>
        </article>
      </div>
    </section>
  `
})
export class SlaComponent implements OnInit {
  tickets: Ticket[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getTickets().subscribe((tickets) => this.tickets = tickets);
  }

  get abertos(): number { return this.tickets.filter((item) => item.status !== 'RESOLVIDO').length; }
  get criticos(): number { return this.tickets.filter((item) => item.urgencia === 'CRITICA').length; }
  get emAtendimento(): number { return this.tickets.filter((item) => item.status === 'EM_ATENDIMENTO').length; }
  get resolvidos(): number { return this.tickets.filter((item) => item.status === 'RESOLVIDO').length; }

  urgenciaClass(urgencia: string): string {
    return urgencia === 'CRITICA' ? 'bg-red-50 text-red-700' : urgencia === 'ALTA' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700';
  }
}
