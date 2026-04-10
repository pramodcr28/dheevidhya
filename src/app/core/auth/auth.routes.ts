import { Routes } from '@angular/router';
import { Access } from './access';
import { Error } from './error';
import { Login } from './login/login';
import { ResetFinishComponent } from './reset-finish/reset-finish.component';

export default [
    { path: 'access', component: Access },
    { path: 'error', component: Error },
    { path: 'login', component: Login },
    { path: 'reset', component: ResetFinishComponent }
] as Routes;
