import React, { createContext, useContext, useReducer } from 'react';

type Workflow = {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type WorkflowState = {
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
};

type WorkflowAction =
  | { type: 'FETCH_WORKFLOWS_START' }
  | { type: 'FETCH_WORKFLOWS_SUCCESS'; payload: Workflow[] }
  | { type: 'FETCH_WORKFLOWS_FAILURE'; payload: string };

const initialState: WorkflowState = {
  workflows: [],
  isLoading: false,
  error: null,
};

const workflowReducer = (state: WorkflowState, action: WorkflowAction): WorkflowState => {
  switch (action.type) {
    case 'FETCH_WORKFLOWS_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'FETCH_WORKFLOWS_SUCCESS':
      return {
        ...state,
        workflows: action.payload,
        isLoading: false,
        error: null,
      };
    case 'FETCH_WORKFLOWS_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

interface WorkflowContextType {
  state: WorkflowState;
  fetchWorkflows: () => Promise<void>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  children: React.ReactNode;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const fetchWorkflows = async () => {
    dispatch({ type: 'FETCH_WORKFLOWS_START' });
    try {
      // Simulating API call
      const response = await new Promise<Workflow[]>(resolve =>
        setTimeout(() => resolve([]), 1000)
      );
      dispatch({ type: 'FETCH_WORKFLOWS_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'FETCH_WORKFLOWS_FAILURE', payload: 'Failed to fetch workflows' });
    }
  };

  const value: WorkflowContextType = {
    state,
    fetchWorkflows,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

