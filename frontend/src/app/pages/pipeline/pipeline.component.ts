// Henrique Agostinetto Piva
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Cliente, Transacao } from '../../core/models';

@Component({
  selector: 'app-pipeline',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">Pipeline Comercial</h1>
      <p class="text-sm text-slate-500">Funil de oportunidades por etapa da carteira.</p>

      <div class="insight-panel mt-5">
        <strong>Gestao de oportunidades</strong>
        <p class="mt-1">Visualize clientes por fase comercial e priorize contas com maior potencial de conversao.</p>
      </div>

      <div class="mt-6 grid gap-4 xl:grid-cols-5">
        <section *ngFor="let etapa of etapas" class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="font-extrabold text-slate-900">{{ etapa }}</h2>
            <span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold">{{ porEtapa(etapa).length }}</span>
          </div>
          <div class="space-y-3">
            <article *ngFor="let cliente of porEtapa(etapa)" class="rounded-md border border-slate-200 p-3 text-sm transition hover:-translate-y-0.5 hover:shadow">
              <p class="font-bold text-slate-950">{{ cliente.nome }}</p>
              <p class="text-xs text-slate-500">{{ cliente.segmento || 'Segmento nao informado' }}</p>
              <div class="mt-3">
                <div class="mb-1 flex justify-between text-xs"><span>Score</span><strong>{{ cliente.prioridade_score }}</strong></div>
                <div class="h-2 rounded-full bg-slate-100"><div class="h-2 rounded-full bg-emerald-500" [style.width.%]="cliente.prioridade_score"></div></div>
              </div>
            </article>
          </div>
        </section>
      </div>

      <section class="card mt-6">
        <h2 class="font-extrabold">Receita registrada no periodo</h2>
        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <article *ngFor="let item of transacoes.slice(0, 6)" class="rounded-md bg-slate-50 p-3 text-sm">
            <p class="font-bold">{{ item.cliente_nome }}</p>
            <p>{{ item.produto }}</p>
            <p class="font-extrabold text-emerald-700">{{ item.valor | currency:'BRL' }}</p>
          </article>
        </div>
      </section>
    </section>
  `
})
export class PipelineComponent implements OnInit {
  clientes: Cliente[] = [];
  transacoes: Transacao[] = [];
  etapas = ['LEAD', 'NEGOCIACAO', 'IMPLANTACAO', 'ATIVO', 'INATIVO'];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
    this.api.getTransacoes().subscribe((items) => this.transacoes = items);
  }

  porEtapa(etapa: string): Cliente[] {
    return this.clientes.filter((cliente) => cliente.status_cliente === etapa);
  }
}
