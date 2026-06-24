// Henrique Agostinetto Piva
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">Agenda e Follow-up</h1>
      <p class="text-sm text-slate-500">Priorização de contatos comerciais e ações de relacionamento.</p>

      <div class="mt-6 grid gap-4 xl:grid-cols-3">
        <article *ngFor="let cliente of clientesOrdenados" class="card">
          <p class="text-xs font-bold uppercase text-slate-500">Proxima acao</p>
          <h2 class="mt-2 font-extrabold">{{ acao(cliente) }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ cliente.nome }}</p>
          <p class="text-xs text-slate-500">{{ cliente.contato || 'Contato pendente' }}</p>
          <div class="mt-4 rounded-md bg-slate-50 p-3 text-sm">
            Prioridade comercial: <strong>{{ cliente.prioridade_score }}/100</strong>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AgendaComponent implements OnInit {
  clientes: Cliente[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
  }

  get clientesOrdenados(): Cliente[] {
    return [...this.clientes].sort((a, b) => b.prioridade_score - a.prioridade_score);
  }

  acao(cliente: Cliente): string {
    if (cliente.status_cliente === 'LEAD') return 'Qualificar oportunidade';
    if (cliente.status_cliente === 'NEGOCIACAO') return 'Enviar proposta revisada';
    if (cliente.status_cliente === 'IMPLANTACAO') return 'Agendar treinamento';
    if (cliente.status_cliente === 'ATIVO') return 'Contato de sucesso do cliente';
    return 'Reativar relacionamento';
  }
}
