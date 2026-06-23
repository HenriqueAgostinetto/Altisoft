import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">Inventario de Instalacoes</h1>
      <p class="text-sm text-slate-500">Visao tecnica dos sistemas contratados e maquinas instaladas.</p>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article *ngFor="let cliente of clientes" class="card">
          <h2 class="font-extrabold">{{ cliente.nome }}</h2>
          <p class="text-sm text-slate-500">{{ cliente.sistema_comprado || 'Sistema pendente' }}</p>
          <div class="mt-4 rounded-md bg-slate-50 p-4">
            <p class="text-xs font-bold uppercase text-slate-500">Maquinas instaladas</p>
            <p class="mt-1 text-3xl font-extrabold">{{ cliente.maquinas_instaladas }}</p>
          </div>
          <p class="mt-3 text-sm">Ambiente: <strong>{{ ambiente(cliente.id) }}</strong></p>
        </article>
      </div>
    </section>
  `
})
export class InventarioComponent implements OnInit {
  clientes: Cliente[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
  }

  ambiente(id: number): string {
    return id % 2 === 0 ? 'Nuvem hibrida' : 'Local + backup em nuvem';
  }
}
