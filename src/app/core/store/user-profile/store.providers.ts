import { provideStore } from '@ngrx/store';
import { metaReducers, userProfileReducer } from '../user-profile/user-profile.reducer';

export const provideAppStore = [
  provideStore({ userProfile: userProfileReducer }, { metaReducers })
];
