import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-base-conhecimento',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">Base de Conhecimento</h1>
      <p class="text-sm text-slate-500">Procedimentos internos para suporte, implantacao e atendimento.</p>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article *ngFor="let item of artigos" class="card hover:-translate-y-1 hover:shadow-lg">
          <p class="text-xs font-bold uppercase text-emerald-700">{{ item.categoria }}</p>
          <h2 class="mt-2 font-extrabold">{{ item.titulo }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ item.descricao }}</p>
          <button class="btn-secondary mt-4">Abrir procedimento</button>
        </article>
      </div>
    </section>
  `
})
export class BaseConhecimentoComponent {
  artigos = [
    { categoria: 'Implantacao', titulo: 'Checklist de instalacao ERP', descricao: 'Passos para validar ambiente, maquinas e acesso inicial.' },
    { categoria: 'Suporte', titulo: 'Triagem de erro fiscal', descricao: 'Fluxo para classificar urgencia e coletar evidencias do cliente.' },
    { categoria: 'Treinamento', titulo: 'Roteiro de onboarding', descricao: 'Agenda recomendada para novos clientes em implantacao.' },
    { categoria: 'Seguranca', titulo: 'Reset de credenciais', descricao: 'Procedimento para troca segura de acessos operacionais.' },
    { categoria: 'Banco de Dados', titulo: 'Backup e restauracao', descricao: 'Rotina de contingencia para ambientes criticos.' },
    { categoria: 'Comercial', titulo: 'Passagem para sucesso do cliente', descricao: 'Informacoes obrigatorias apos fechamento da venda.' }
  ];
}
