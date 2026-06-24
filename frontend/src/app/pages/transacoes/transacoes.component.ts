// Henrique Agostinetto Piva
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Cliente, Transacao } from '../../core/models';

@Component({
  selector: 'app-transacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-950">Transacoes / Vendas</h1>
          <p class="text-sm text-slate-500">Vendas com auditoria, relatorio CSV e governanca por soft delete.</p>
        </div>
        <div class="flex gap-2">
          <button (click)="exportar()" class="btn-secondary">Exportar Relatorio</button>
          <button (click)="showForm = !showForm" class="btn-primary">Nova Venda</button>
        </div>
      </div>

      <div class="insight-panel mt-5">
        <strong>Operacao comercial</strong>
        <p class="mt-1">Registro de vendas, controle de status e exportacao de relatorios para acompanhamento financeiro e operacional.</p>
      </div>

      <form *ngIf="showForm" (ngSubmit)="create()" class="card soft-pop mt-5 grid gap-4 md:grid-cols-2">
        <select [(ngModel)]="form.cliente_id" name="cliente" class="rounded-md border border-slate-300 px-3 py-2" required>
          <option [ngValue]="undefined">Selecione o cliente</option>
          <option *ngFor="let cliente of clientes" [ngValue]="cliente.id">{{ cliente.nome }}</option>
        </select>
        <input [(ngModel)]="form.produto" name="produto" placeholder="Produto" class="rounded-md border border-slate-300 px-3 py-2" required>
        <input [(ngModel)]="form.valor" name="valor" type="number" min="1" step="0.01" placeholder="Valor" class="rounded-md border border-slate-300 px-3 py-2" required>
        <select [(ngModel)]="form.status" name="status" class="rounded-md border border-slate-300 px-3 py-2">
          <option>PENDENTE</option>
          <option>PAGO</option>
          <option>CANCELADO</option>
        </select>
        <button class="btn-primary md:col-span-2">Salvar Venda</button>
      </form>

      <div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
            <tr><th class="px-4 py-3">Cliente</th><th class="px-4 py-3">Produto</th><th class="px-4 py-3">Valor</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Acao</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let item of transacoes">
              <td class="px-4 py-3 font-semibold">{{ item.cliente_nome }}</td>
              <td class="px-4 py-3">{{ item.produto }}</td>
              <td class="px-4 py-3 font-bold text-emerald-700">{{ item.valor | currency:'BRL' }}</td>
              <td class="px-4 py-3">{{ item.status }}</td>
              <td class="px-4 py-3"><button (click)="delete(item)" class="rounded-md border border-red-200 px-3 py-1 text-xs font-bold text-red-700">Excluir</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class TransacoesComponent implements OnInit {
  clientes: Cliente[] = [];
  transacoes: Transacao[] = [];
  showForm = false;
  form: Partial<Transacao> = { status: 'PENDENTE' };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
    this.load();
  }

  load(): void {
    this.api.getTransacoes().subscribe((items) => this.transacoes = items);
  }

  create(): void {
    this.api.createTransacao(this.form).subscribe(() => {
      this.form = { status: 'PENDENTE' };
      this.showForm = false;
      this.load();
    });
  }

  delete(item: Transacao): void {
    this.api.deleteTransacao(item.id).subscribe(() => this.load());
  }

  exportar(): void {
    this.api.exportTransacoes().subscribe((blob) => this.download(blob, 'transacoes_altisoft.csv'));
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
