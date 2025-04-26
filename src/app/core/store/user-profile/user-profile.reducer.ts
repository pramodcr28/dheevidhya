import { createReducer, on, Action, MetaReducer } from '@ngrx/store';
import * as UserProfileActions from './user-profile.actions';


export interface UserProfileState {
  user: any;
  departments:any[];
  loading: boolean;
  isAuthenticated: boolean;
  token: string;
}

const localStorageKey = 'userProfileState';

export const initialState: UserProfileState = (() => {
  const savedState = localStorage.getItem(localStorageKey);
  return savedState ? JSON.parse(savedState) : { 
    user: null, 
    loading: false, 
    isAuthenticated: false, 
    token: "" ,
    departments : []
  };
})();

export const userProfileReducer = createReducer(
  initialState,
  on(UserProfileActions.loadUserProfile, (state, { user }) => ({
    ...state,
    user,
    loading: true
  })),
  on(UserProfileActions.loadUserAssociatedDepartments, (state, { departments }) => ({
    ...state,
    departments,
    loading: false,
    isAuthenticated: true
  })),
  on(UserProfileActions.loadUserProfileSuccess, (state, { user }) => ({
    ...state,
    user,
    loading: false,
    isAuthenticated: true
  })),
  on(UserProfileActions.clearUserProfile, () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
    token: "",
    departments : []
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