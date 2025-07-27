export interface INodeExecutionData {
  data: {
    main: INodeData[][];
  };
}

export interface INodeData {
  json: Record<string, any>;
  binary?: IBinaryData;
  pairedItem?: IPairedItemData | IPairedItemData[];
}

export interface IBinaryData {
  [key: string]: IBinaryDataBuffer;
}

export interface IBinaryDataBuffer {
  data: Buffer;
  mimeType: string;
  fileName?: string;
  fileExtension?: string;
  directory?: string;
  fileSize?: number;
}

export interface IPairedItemData {
  item: number;
  input?: number;
}

export interface IExecuteData {
  data: INodeExecutionData;
  node: INode;
  source: {
    main: ISourceData[];
  } | null;
}

export interface ISourceData {
  previousNode: string;
  previousNodeOutput?: number;
  previousNodeRun?: number;
}

export interface IExecuteFunctions {
  getInputData(inputIndex?: number, inputName?: string): INodeData[];
  getNodeParameter(parameterName: string, fallbackValue?: any): any;
  getCredentials(type: string): Promise<ICredentialDataDecryptedObject>;
  helpers: {
    httpRequest(requestOptions: any): Promise<any>;
    returnJsonArray(jsonData: any[]): INodeData[];
  };
  continueOnFail(): boolean;
  getMode(): 'manual' | 'trigger' | 'webhook';
  getExecutionId(): string;
  getWorkflowId(): string;
  getNodeId(): string;
  logger: {
    debug(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
  };
}

export interface ICredentialDataDecryptedObject {
  [key: string]: string | number | boolean;
}

export interface INode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: INodeParameters;
  credentials?: INodeCredentials;
  continueOnFail?: boolean;
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
  notes?: string;
  notesInFlow?: boolean;
  color?: string;
  disabled?: boolean;
}

export interface INodeParameters {
  [key: string]: any;
}

export interface INodeCredentials {
  [key: string]: {
    id: string;
    name?: string;
  };
}

export interface INodeType {
  description: INodeTypeDescription;
  execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
}

export interface INodeTypeDescription {
  displayName: string;
  name: string;
  icon?: string;
  group: string[];
  version: number | number[];
  description: string;
  defaults: {
    name: string;
    color?: string;
  };
  inputs: Array<string | INodeInputConfiguration>;
  outputs: Array<string | INodeOutputConfiguration>;
  credentials?: INodeCredentialDescription[];
  properties: INodeProperties[];
  maxNodes?: number;
  polling?: boolean;
  hooks?: {
    activate?: string[];
    deactivate?: string[];
  };
  webhooks?: IWebhookDescription[];
  codex?: {
    categories?: string[];
    subcategories?: string[];
    resources?: {
      primaryDocumentation?: IDocumentationLink[];
      credentialDocumentation?: IDocumentationLink[];
    };
  };
}

export interface INodeInputConfiguration {
  displayName?: string;
  type: string;
  required?: boolean;
  maxConnections?: number;
}

export interface INodeOutputConfiguration {
  displayName?: string;
  type: string;
}

export interface INodeCredentialDescription {
  name: string;
  required?: boolean;
  displayOptions?: IDisplayOptions;
  testedBy?: ICredentialTestRequest | string;
}

export interface IDisplayOptions {
  show?: {
    [key: string]: Array<string | number | boolean>;
  };
  hide?: {
    [key: string]: Array<string | number | boolean>;
  };
}

export interface ICredentialTestRequest {
  request: {
    baseURL?: string;
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: Record<string, any>;
  };
  rules?: Array<{
    type: string;
    properties: Record<string, any>;
  }>;
}

export interface INodeProperties {
  displayName: string;
  name: string;
  type: 'boolean' | 'collection' | 'color' | 'dateTime' | 'fixedCollection' | 'hidden' | 'json' | 'multiOptions' | 'notice' | 'number' | 'options' | 'string' | 'credentialsSelect';
  noDataExpression?: boolean;
  required?: boolean;
  default: any;
  description?: string;
  hint?: string;
  placeholder?: string;
  options?: INodePropertyOptions[];
  values?: INodePropertyCollection[];
  typeOptions?: {
    editor?: string;
    rows?: number;
    password?: boolean;
    multipleValues?: boolean;
    loadOptionsMethod?: string;
  };
  displayOptions?: IDisplayOptions;
  routing?: {
    send?: {
      property?: string;
      type?: string;
      value?: string;
    };
    output?: {
      postReceive?: {
        type: string;
        properties?: Record<string, any>;
      }[];
    };
  };
}

export interface INodePropertyOptions {
  name: string;
  value: string | number | boolean;
  description?: string;
  action?: string;
  routing?: {
    send?: Record<string, any>;
    output?: Record<string, any>;
  };
}

export interface INodePropertyCollection {
  displayName: string;
  name: string;
  values: INodeProperties[];
}

export interface IWebhookDescription {
  name: string;
  httpMethod: string | string[];
  responseMode?: string;
  path: string;
  responseBinaryPropertyName?: string;
  responseContentType?: string;
  responsePropertyName?: string;
  restartWebhook?: boolean;
  isFullPath?: boolean;
  ndvHideUrl?: boolean;
  ndvHideMethod?: boolean;
}

export interface IDocumentationLink {
  url: string;
}

export enum NodeExecutionStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  WAITING = 'waiting'
}

export enum WorkflowExecutionStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled',
  WAITING = 'waiting',
  NEW = 'new'
}
