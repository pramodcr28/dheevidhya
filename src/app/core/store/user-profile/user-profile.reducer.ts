import { createReducer, on, Action, MetaReducer } from '@ngrx/store';
import * as UserProfileActions from './user-profile.actions';


export interface UserProfileState {
  userConfig: any;
  loading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

export const localStorageKey = 'userProfileState';

export const initialState: UserProfileState = (() => {
  const savedState = localStorage.getItem(localStorageKey);
  return savedState ? JSON.parse(savedState) : { 
    userConfig: null, 
    loading: false, 
    isAuthenticated: false, 
    token: null ,
  };
})();

export const userProfileReducer = createReducer(
  initialState,
  on(UserProfileActions.loadUserProfile, (state, { userConfig }) => ({
    ...state,
    userConfig,
    loading: true
  })),
  on(UserProfileActions.loadUserProfileSuccess, (state, { userConfig }) => ({
    ...state,
    userConfig,
    loading: false,
    isAuthenticated: true
  })),
  on(UserProfileActions.clearUserProfile, () => ({
    userConfig: null,
    loading: false,
    isAuthenticated: false,
    token: null
  })),
  on(UserProfileActions.addToken, (state, { token }) => ({
    ...state,
    token,
    loading: false,
    isAuthenticated: true
  }))
);

export function localStorageMetaReducer(
  reducer: (state: { userProfile: UserProfileState } | undefined, action: Action) => any
): (state: { userProfile: UserProfileState } | undefined, action: Action) => any {
  return function (state, action) {
    const newState = reducer(state, action);

    if (newState?.userProfile) {
      localStorage.setItem(localStorageKey, JSON.stringify(newState.userProfile));
    }

    return newState;
  };
}

export const metaReducers: MetaReducer<{ userProfile: UserProfileState }>[] = [localStorageMetaReducer];