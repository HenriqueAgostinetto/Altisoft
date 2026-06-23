import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';
import { CrmComponent } from './pages/crm/crm.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { SuporteComponent } from './pages/suporte/suporte.component';
import { TransacoesComponent } from './pages/transacoes/transacoes.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AgendaComponent } from './pages/agenda/agenda.component';
import { BaseConhecimentoComponent } from './pages/base-conhecimento/base-conhecimento.component';
import { ContratosComponent } from './pages/contratos/contratos.component';
import { InventarioComponent } from './pages/inventario/inventario.component';
import { PipelineComponent } from './pages/pipeline/pipeline.component';
import { PropostasComponent } from './pages/propostas/propostas.component';
import { SlaComponent } from './pages/sla/sla.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'crm', component: CrmComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'VENDAS'])] },
  { path: 'pipeline', component: PipelineComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'VENDAS'])] },
  { path: 'propostas', component: PropostasComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'VENDAS'])] },
  { path: 'agenda', component: AgendaComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'VENDAS'])] },
  { path: 'contratos', component: ContratosComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'VENDAS'])] },
  { path: 'vendas', component: TransacoesComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'VENDAS'])] },
  { path: 'suporte', component: SuporteComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'SUPORTE'])] },
  { path: 'sla', component: SlaComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'SUPORTE'])] },
  { path: 'inventario', component: InventarioComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'SUPORTE'])] },
  { path: 'base-conhecimento', component: BaseConhecimentoComponent, canActivate: [authGuard, roleGuard(['ADMIN', 'SUPORTE'])] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, roleGuard(['ADMIN'])] },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
