// Henrique Agostinetto Piva
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuditLog, TrashItem } from '../../core/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-950">Governanca de Dados</h1>
        <p class="text-sm text-slate-500">Lixeira de exclusao logica e trilha de auditoria visiveis apenas para Admin.</p>
      </div>

      <div class="insight-panel mt-5">
        <strong>Governanca e rastreabilidade</strong>
        <p class="mt-1">Recuperacao de registros excluidos logicamente e consulta da trilha de auditoria das operacoes sensiveis do sistema.</p>
      </div>

      <div class="mt-5 flex gap-2">
        <button (click)="tab='lixeira'" [class.bg-brand-900]="tab==='lixeira'" [class.text-white]="tab==='lixeira'" class="btn-secondary">Lixeira</button>
        <button (click)="tab='auditoria'" [class.bg-brand-900]="tab==='auditoria'" [class.text-white]="tab==='auditoria'" class="btn-secondary">Auditoria</button>
      </div>

      <section *ngIf="tab === 'lixeira'" class="card mt-6">
        <h2 class="font-extrabold">Itens excluidos logicamente</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-200 text-sm">
            <thead class="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
              <tr><th class="px-4 py-3">Tipo</th><th class="px-4 py-3">Item</th><th class="px-4 py-3">Excluido em</th><th class="px-4 py-3">Acao</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let item of lixeira">
                <td class="px-4 py-3 font-bold">{{ item.entity }}</td>
                <td class="px-4 py-3">{{ item.label }}</td>
                <td class="px-4 py-3">{{ item.deleted_at | date:'short' }}</td>
                <td class="px-4 py-3"><button (click)="restaurar(item)" class="btn-primary">Restaurar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section *ngIf="tab === 'auditoria'" class="card mt-6">
        <h2 class="font-extrabold">Trilha de Auditoria</h2>
        <div class="mt-4 space-y-3">
          <article *ngFor="let log of auditoria" class="rounded-md bg-slate-50 p-3 text-sm">
            <p class="font-bold">{{ log.description }}</p>
            <p class="text-xs text-slate-500">{{ log.created_at | date:'short' }} - {{ log.username }} / {{ log.role }} - {{ log.action }} {{ log.entity }}</p>
          </article>
        </div>
      </section>
    </section>
  `
})
export class AdminComponent implements OnInit {
  tab: 'lixeira' | 'auditoria' = 'lixeira';
  lixeira: TrashItem[] = [];
  auditoria: AuditLog[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getLixeira().subscribe((items) => this.lixeira = items);
    this.api.getAuditoria().subscribe((items) => this.auditoria = items);
  }

  restaurar(item: TrashItem): void {
    this.api.restaurarItem(item.entity, item.id).subscribe(() => this.load());
  }
}
