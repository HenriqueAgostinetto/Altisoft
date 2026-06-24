// Henrique Agostinetto Piva
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DashboardResumo, UrgenciaResumo } from '../../core/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">Dashboard Gerencial</h1>
      <p class="text-sm text-slate-500">KPIs protegidos por RBAC no backend e mascarados no frontend.</p>

      <div class="insight-panel mt-5">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <strong>Visao executiva</strong>
            <p class="mt-1">Indicadores consolidados de clientes, suporte e desempenho comercial com visibilidade financeira conforme perfil de acesso.</p>
          </div>
          <img src="assets/brand/logo-altisoft-mark.png" alt="Altisoft Intelligence" class="h-16 w-16 rounded-md object-contain opacity-80">
        </div>
      </div>

      <section class="brand-watermark card mt-6 overflow-hidden">
        <div class="relative z-10 max-w-3xl">
          <p class="text-xs font-extrabold uppercase tracking-widest text-emerald-700">Altisoft Intelligence</p>
          <h2 class="mt-2 text-xl font-extrabold text-slate-950">solucoes corporativas inteligentes para gestao, dados e crescimento</h2>
          <p class="mt-2 text-sm text-slate-600">Uma plataforma integrada para decisao executiva, operacao comercial e atendimento tecnico.</p>
        </div>
        <img src="assets/brand/logo-altisoft-mark.png" alt="" class="pointer-events-none absolute -right-8 -top-10 h-48 w-48 object-contain opacity-5">
      </section>

      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <article class="card">
          <p class="text-sm font-bold text-slate-500">Faturamento Total</p>
          <ng-container *ngIf="resumo && !resumo.faturamento_restrito; else restricted">
            <p class="mt-3 text-3xl font-extrabold text-emerald-700">{{ resumo.faturamento_total || 0 | currency:'BRL' }}</p>
          </ng-container>
          <ng-template #restricted>
            <div class="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p class="text-sm font-extrabold text-amber-800">Indicador financeiro protegido</p>
              <p class="mt-1 text-xs text-amber-700">Seu perfil pode acompanhar operacao e clientes, mas o valor consolidado fica restrito ao Administrador.</p>
            </div>
          </ng-template>
        </article>
        <article class="card">
          <p class="text-sm font-bold text-slate-500">Clientes Cadastrados</p>
          <p class="mt-3 text-3xl font-extrabold">{{ resumo?.total_clientes || 0 }}</p>
        </article>
        <article class="card">
          <p class="text-sm font-bold text-slate-500">Chamados em Aberto</p>
          <p class="mt-3 text-3xl font-extrabold">{{ resumo?.chamados_abertos || 0 }}</p>
        </article>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-2">
        <section class="card" *ngIf="auth.hasRole('ADMIN')">
          <h2 class="font-extrabold text-slate-950">Evolucao de Vendas</h2>
          <div class="mt-4 h-72"><canvas #salesChart></canvas></div>
        </section>

        <section class="card" *ngIf="auth.hasRole('ADMIN','SUPORTE')">
          <h2 class="font-extrabold text-slate-950">Chamados por Urgencia</h2>
          <div class="mt-4 h-72"><canvas #urgencyChart></canvas></div>
        </section>
      </div>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  @ViewChild('salesChart') salesChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('urgencyChart') urgencyChartRef?: ElementRef<HTMLCanvasElement>;

  resumo?: DashboardResumo;
  faturamento: { mes: string; total: number }[] = [];
  urgencias: UrgenciaResumo[] = [];
  private salesChart?: Chart;
  private urgencyChart?: Chart;

  constructor(private api: ApiService, public auth: AuthService) {}

  ngOnInit(): void {
    this.api.getResumo().subscribe((resumo) => this.resumo = resumo);
    if (this.auth.hasRole('ADMIN')) {
      this.api.getFaturamento().subscribe((rows) => {
        this.faturamento = rows;
        setTimeout(() => this.renderSalesChart());
      });
    }
    if (this.auth.hasRole('ADMIN', 'SUPORTE')) {
      this.api.getTicketsUrgencia().subscribe((rows) => {
        this.urgencias = rows;
        setTimeout(() => this.renderUrgencyChart());
      });
    }
  }

  private renderSalesChart(): void {
    if (!this.salesChartRef) return;
    this.salesChart?.destroy();
    this.salesChart = new Chart(this.salesChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: this.faturamento.map((row) => `Mes ${row.mes}`),
        datasets: [{
          label: 'Faturamento',
          data: this.faturamento.map((row) => Number(row.total)),
          borderColor: '#059669',
          backgroundColor: 'rgba(5, 150, 105, .12)',
          tension: .35,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private renderUrgencyChart(): void {
    if (!this.urgencyChartRef) return;
    this.urgencyChart?.destroy();
    this.urgencyChart = new Chart(this.urgencyChartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: this.urgencias.map((row) => row.urgencia),
        datasets: [{
          data: this.urgencias.map((row) => row.total),
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#7c3aed']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}
