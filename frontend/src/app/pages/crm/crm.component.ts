import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Cliente, ClienteDetalhe } from '../../core/models';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-950">CRM Clientes</h1>
          <p class="text-sm text-slate-500">Gestao de relacionamento, funil comercial, tarefas e historico de interacoes.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button (click)="exportar()" class="btn-secondary">Exportar CSV</button>
          <button *ngIf="auth.hasRole('ADMIN','VENDAS')" (click)="openCreate()" class="btn-primary">Novo Cliente</button>
        </div>
      </div>

      <div class="insight-panel mt-5">
        <strong>Carteira comercial</strong>
        <p class="mt-1">Acompanhamento de clientes por etapa, prioridade, interacoes, tarefas comerciais, vendas relacionadas e chamados vinculados.</p>
      </div>

      <div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article class="card soft-pop"><p class="text-xs font-bold uppercase text-slate-500">Clientes</p><p class="mt-2 text-3xl font-extrabold">{{ clientes.length }}</p></article>
        <article class="card soft-pop"><p class="text-xs font-bold uppercase text-slate-500">Ativos</p><p class="mt-2 text-3xl font-extrabold text-emerald-700">{{ countByStatus('ATIVO') }}</p></article>
        <article class="card soft-pop"><p class="text-xs font-bold uppercase text-slate-500">Implantacao</p><p class="mt-2 text-3xl font-extrabold text-blue-700">{{ countByStatus('IMPLANTACAO') }}</p></article>
        <article class="card soft-pop"><p class="text-xs font-bold uppercase text-slate-500">Maquinas</p><p class="mt-2 text-3xl font-extrabold">{{ totalMaquinas }}</p></article>
        <article class="card soft-pop"><p class="text-xs font-bold uppercase text-slate-500">Sistema lider</p><p class="mt-2 text-lg font-extrabold">{{ sistemaMaisVendido }}</p></article>
      </div>

      <div class="card mt-5 grid gap-3 md:grid-cols-4">
        <input [(ngModel)]="search" placeholder="Buscar por nome ou contato" class="rounded-md border border-slate-300 px-3 py-2 md:col-span-2">
        <select [(ngModel)]="statusFilter" class="rounded-md border border-slate-300 px-3 py-2">
          <option value="">Todos os status</option>
          <option *ngFor="let status of statusOptions" [value]="status">{{ status }}</option>
        </select>
        <select [(ngModel)]="segmentoFilter" class="rounded-md border border-slate-300 px-3 py-2">
          <option value="">Todos os segmentos</option>
          <option *ngFor="let segmento of segmentos" [value]="segmento">{{ segmento }}</option>
        </select>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article *ngFor="let cliente of filteredClientes" class="card soft-pop hover:-translate-y-1 hover:shadow-lg">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-extrabold text-slate-950">{{ cliente.nome }}</h2>
              <p class="text-sm text-slate-500">{{ cliente.segmento || 'Sem segmento' }}</p>
            </div>
            <span class="rounded-md px-2 py-1 text-xs font-bold" [ngClass]="statusClass(cliente.status_cliente)">{{ cliente.status_cliente }}</span>
          </div>
          <div class="mt-4 space-y-2 text-sm">
            <p><strong>Contato:</strong> {{ cliente.contato || '-' }}</p>
            <p><strong>Sistema:</strong> {{ cliente.sistema_comprado || '-' }}</p>
            <p><strong>Maquinas:</strong> {{ cliente.maquinas_instaladas }}</p>
            <div>
              <div class="mb-1 flex justify-between text-xs font-bold"><span>Score</span><span>{{ cliente.prioridade_score }}/100</span></div>
              <div class="h-2 rounded-full bg-slate-100"><div class="h-2 rounded-full bg-emerald-500" [style.width.%]="cliente.prioridade_score"></div></div>
            </div>
          </div>
          <div class="mt-5 flex flex-wrap gap-2">
            <button (click)="openDetails(cliente)" class="btn-primary">Detalhes</button>
            <button *ngIf="auth.hasRole('ADMIN','VENDAS')" (click)="delete(cliente)" class="rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700">Excluir</button>
          </div>
        </article>
      </div>

      <div *ngIf="filteredClientes.length === 0" class="card mt-6 text-center text-sm text-slate-500">
        Nenhum cliente encontrado com os filtros atuais.
      </div>

      <div *ngIf="showCreate" class="modal-backdrop" (click)="closeModals()">
        <form (click)="$event.stopPropagation()" (ngSubmit)="create()" class="dialog-panel max-w-3xl">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-xl font-extrabold">Novo Cliente CRM</h2>
            <button type="button" (click)="closeModals()" class="text-slate-400 hover:text-slate-700">x</button>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <input [(ngModel)]="form.nome" name="nome" placeholder="Nome" class="rounded-md border border-slate-300 px-3 py-2" required>
            <input [(ngModel)]="form.segmento" name="segmento" placeholder="Segmento" class="rounded-md border border-slate-300 px-3 py-2">
            <input [(ngModel)]="form.contato" name="contato" placeholder="Contato" class="rounded-md border border-slate-300 px-3 py-2">
            <input [(ngModel)]="form.sistema_comprado" name="sistema" placeholder="Sistema comprado" class="rounded-md border border-slate-300 px-3 py-2">
            <input [(ngModel)]="form.maquinas_instaladas" name="maquinas" type="number" min="0" placeholder="Maquinas" class="rounded-md border border-slate-300 px-3 py-2">
            <select [(ngModel)]="form.status_cliente" name="status_cliente" class="rounded-md border border-slate-300 px-3 py-2">
              <option *ngFor="let status of statusOptions" [value]="status">{{ status }}</option>
            </select>
            <label class="md:col-span-2">
              <span class="text-sm font-bold text-slate-600">Score de prioridade</span>
              <input [(ngModel)]="form.prioridade_score" name="score" type="range" min="0" max="100" class="mt-2 w-full">
            </label>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" (click)="closeModals()" class="btn-secondary">Cancelar</button>
            <button class="btn-primary">Salvar Cliente</button>
          </div>
        </form>
      </div>

      <div *ngIf="detalhe" class="modal-backdrop" (click)="closeModals()">
        <div (click)="$event.stopPropagation()" class="dialog-panel max-w-6xl">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-2xl font-extrabold">{{ detalhe.cliente.nome }}</h2>
              <p class="text-sm text-slate-500">{{ detalhe.cliente.segmento }} - {{ detalhe.cliente.contato }}</p>
            </div>
            <button (click)="closeModals()" class="text-slate-400 hover:text-slate-700">x</button>
          </div>

          <div class="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
            <section class="card">
              <h3 class="font-extrabold">Dados e funil</h3>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <select [(ngModel)]="detalhe.cliente.status_cliente" class="rounded-md border border-slate-300 px-3 py-2">
                  <option *ngFor="let status of statusOptions" [value]="status">{{ status }}</option>
                </select>
                <input [(ngModel)]="detalhe.cliente.prioridade_score" type="number" min="0" max="100" class="rounded-md border border-slate-300 px-3 py-2">
              </div>
              <button (click)="saveClienteStatus()" class="btn-primary mt-4">Atualizar Cliente</button>
            </section>

            <section class="card">
              <h3 class="font-extrabold">Nova tarefa</h3>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <input [(ngModel)]="taskForm.titulo" placeholder="Ex: Enviar proposta" class="rounded-md border border-slate-300 px-3 py-2 md:col-span-2">
                <input [(ngModel)]="taskForm.responsavel" placeholder="Responsavel" class="rounded-md border border-slate-300 px-3 py-2">
                <input [(ngModel)]="taskForm.prazo" type="date" class="rounded-md border border-slate-300 px-3 py-2">
              </div>
              <button (click)="createTask()" class="btn-primary mt-4">Adicionar Tarefa</button>
            </section>
          </div>

          <div class="mt-5 grid gap-5 xl:grid-cols-2">
            <section class="card">
              <h3 class="font-extrabold">Historico de interacoes</h3>
              <div class="mt-4 grid gap-3 md:grid-cols-[160px_1fr]">
                <select [(ngModel)]="interactionForm.tipo" class="rounded-md border border-slate-300 px-3 py-2">
                  <option>Ligacao</option><option>Email</option><option>Reuniao</option><option>Nota</option>
                </select>
                <input [(ngModel)]="interactionForm.descricao" placeholder="Descreva a interacao" class="rounded-md border border-slate-300 px-3 py-2">
              </div>
              <button (click)="createInteraction()" class="btn-secondary mt-3">Registrar</button>
              <div class="mt-4 space-y-3">
                <article *ngFor="let item of detalhe.interacoes" class="rounded-md bg-slate-50 p-3 text-sm">
                  <p class="font-bold">{{ item.tipo }}</p>
                  <p>{{ item.descricao }}</p>
                  <p class="text-xs text-slate-500">{{ item.created_at | date:'short' }}</p>
                </article>
              </div>
            </section>

            <section class="card">
              <h3 class="font-extrabold">Tarefas comerciais</h3>
              <div class="mt-4 space-y-3">
                <article *ngFor="let task of detalhe.tarefas" class="rounded-md bg-slate-50 p-3 text-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-bold">{{ task.titulo }}</p>
                      <p class="text-xs text-slate-500">Responsavel: {{ task.responsavel || '-' }} - Prazo: {{ task.prazo || '-' }}</p>
                    </div>
                    <button (click)="completeTask(task)" class="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{{ task.status }}</button>
                  </div>
                </article>
              </div>
            </section>

            <section class="card">
              <h3 class="font-extrabold">Vendas relacionadas</h3>
              <p *ngFor="let venda of detalhe.transacoes" class="mt-3 rounded-md bg-slate-50 p-3 text-sm">{{ venda.produto }} - {{ venda.valor | currency:'BRL' }} - {{ venda.status }}</p>
            </section>

            <section class="card">
              <h3 class="font-extrabold">Tickets relacionados</h3>
              <p *ngFor="let ticket of detalhe.tickets" class="mt-3 rounded-md bg-slate-50 p-3 text-sm">{{ ticket.assunto }} - {{ ticket.urgencia }} - {{ ticket.status }}</p>
            </section>
          </div>
        </div>
      </div>
    </section>
  `
})
export class CrmComponent implements OnInit {
  clientes: Cliente[] = [];
  detalhe?: ClienteDetalhe;
  showCreate = false;
  search = '';
  statusFilter = '';
  segmentoFilter = '';
  statusOptions = ['LEAD', 'NEGOCIACAO', 'ATIVO', 'IMPLANTACAO', 'INATIVO'];
  form: Partial<Cliente> = { maquinas_instaladas: 1, status_cliente: 'LEAD', prioridade_score: 50 };
  interactionForm = { tipo: 'Ligacao', descricao: '' };
  taskForm = { titulo: '', responsavel: '', prazo: '', status: 'PENDENTE' };

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  get filteredClientes(): Cliente[] {
    const term = this.search.toLowerCase().trim();
    return this.clientes.filter((cliente) => {
      const matchesTerm = !term || `${cliente.nome} ${cliente.contato || ''}`.toLowerCase().includes(term);
      const matchesStatus = !this.statusFilter || cliente.status_cliente === this.statusFilter;
      const matchesSegmento = !this.segmentoFilter || cliente.segmento === this.segmentoFilter;
      return matchesTerm && matchesStatus && matchesSegmento;
    });
  }

  get segmentos(): string[] {
    return [...new Set(this.clientes.map((cliente) => cliente.segmento).filter(Boolean) as string[])];
  }

  get totalMaquinas(): number {
    return this.clientes.reduce((total, cliente) => total + Number(cliente.maquinas_instaladas || 0), 0);
  }

  get sistemaMaisVendido(): string {
    const counts = this.clientes.reduce<Record<string, number>>((acc, cliente) => {
      const key = cliente.sistema_comprado || 'Nao informado';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  }

  load(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
  }

  countByStatus(status: string): number {
    return this.clientes.filter((cliente) => cliente.status_cliente === status).length;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      LEAD: 'bg-slate-100 text-slate-700',
      NEGOCIACAO: 'bg-amber-50 text-amber-700',
      ATIVO: 'bg-emerald-50 text-emerald-700',
      IMPLANTACAO: 'bg-blue-50 text-blue-700',
      INATIVO: 'bg-red-50 text-red-700'
    };
    return map[status] || map['LEAD'];
  }

  openCreate(): void {
    this.showCreate = true;
  }

  openDetails(cliente: Cliente): void {
    this.api.getClienteDetalhes(cliente.id).subscribe((detalhe) => this.detalhe = detalhe);
  }

  closeModals(): void {
    this.showCreate = false;
    this.detalhe = undefined;
  }

  create(): void {
    this.api.createCliente(this.form).subscribe(() => {
      this.form = { maquinas_instaladas: 1, status_cliente: 'LEAD', prioridade_score: 50 };
      this.showCreate = false;
      this.load();
    });
  }

  saveClienteStatus(): void {
    if (!this.detalhe) return;
    this.api.updateCliente(this.detalhe.cliente.id, {
      status_cliente: this.detalhe.cliente.status_cliente,
      prioridade_score: this.detalhe.cliente.prioridade_score
    }).subscribe((cliente) => {
      this.detalhe!.cliente = cliente;
      this.load();
    });
  }

  createInteraction(): void {
    if (!this.detalhe || !this.interactionForm.descricao.trim()) return;
    this.api.createInteracao(this.detalhe.cliente.id, this.interactionForm).subscribe(() => {
      const id = this.detalhe!.cliente.id;
      this.interactionForm = { tipo: 'Ligacao', descricao: '' };
      this.openDetails({ ...this.detalhe!.cliente, id });
    });
  }

  createTask(): void {
    if (!this.detalhe || !this.taskForm.titulo.trim()) return;
    this.api.createTarefa(this.detalhe.cliente.id, this.taskForm).subscribe(() => {
      const id = this.detalhe!.cliente.id;
      this.taskForm = { titulo: '', responsavel: '', prazo: '', status: 'PENDENTE' };
      this.openDetails({ ...this.detalhe!.cliente, id });
    });
  }

  completeTask(task: any): void {
    this.api.updateTarefa(task.id, { ...task, status: 'CONCLUIDA' }).subscribe(() => this.openDetails(this.detalhe!.cliente));
  }

  delete(cliente: Cliente): void {
    this.api.deleteCliente(cliente.id).subscribe(() => this.load());
  }

  exportar(): void {
    this.api.exportClientes().subscribe((blob) => this.download(blob, 'clientes_altisoft.csv'));
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
