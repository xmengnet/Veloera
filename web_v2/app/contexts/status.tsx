'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

interface StatusState {
  status: string | undefined;
}

type StatusAction = 
  | { type: 'set'; payload: string }
  | { type: 'unset' };

type StatusDispatch = (action: StatusAction) => void;

const initialState: StatusState = {
  status: undefined,
};

const StatusContext = createContext<[StatusState, StatusDispatch] | undefined>(undefined);

function statusReducer(state: StatusState, action: StatusAction): StatusState {
  switch (action.type) {
    case 'set':
      return {
        ...state,
        status: action.payload,
      };
    case 'unset':
      return {
        ...state,
        status: undefined,
      };
    default:
      return state;
  }
}

export function StatusProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(statusReducer, initialState);

  return (
    <StatusContext.Provider value={[state, dispatch]}>
      {children}
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
}