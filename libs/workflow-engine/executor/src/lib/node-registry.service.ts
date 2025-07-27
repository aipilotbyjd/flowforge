import { Injectable, Logger } from '@nestjs/common';
import { INodeType, INodeTypeDescription } from './interfaces/node.interface';
import { ManualTrigger } from './nodes/ManualTrigger.node';
import { SetNode } from './nodes/Set.node';
import { HttpRequestNode } from './nodes/HttpRequest.node';

@Injectable()
export class NodeRegistryService {
  private readonly logger = new Logger(NodeRegistryService.name);
  private readonly nodeTypes = new Map<string, new () => INodeType>();
  private readonly nodeDescriptions = new Map<string, INodeTypeDescription>();

  constructor() {
    this.loadCoreNodes();
  }

  private loadCoreNodes(): void {
    this.logger.debug('Loading core node types...');

    // Register core nodes
    this.registerNode(ManualTrigger);
    this.registerNode(SetNode);
    this.registerNode(HttpRequestNode);

    this.logger.log(`Loaded ${this.nodeTypes.size} node types`);
  }

  private registerNode(nodeClass: new () => INodeType): void {
    try {
      const nodeInstance = new nodeClass();
      const nodeName = nodeInstance.description.name;
      
      this.nodeTypes.set(nodeName, nodeClass);
      this.nodeDescriptions.set(nodeName, nodeInstance.description);
      
      this.logger.debug(`Registered node: ${nodeName}`);
    } catch (error) {
      this.logger.error(`Failed to register node: ${nodeClass.name}`, error);
    }
  }

  getNodeType(nodeName: string): INodeType | null {
    const NodeClass = this.nodeTypes.get(nodeName);
    if (!NodeClass) {
      this.logger.warn(`Node type not found: ${nodeName}`);
      return null;
    }

    try {
      return new NodeClass();
    } catch (error) {
      this.logger.error(`Failed to instantiate node: ${nodeName}`, error);
      return null;
    }
  }

  getNodeDescription(nodeName: string): INodeTypeDescription | null {
    return this.nodeDescriptions.get(nodeName) || null;
  }

  getAllNodeTypes(): INodeTypeDescription[] {
    return Array.from(this.nodeDescriptions.values());
  }

  getNodeTypesByCategory(category?: string): INodeTypeDescription[] {
    if (!category) {
      return this.getAllNodeTypes();
    }

    return Array.from(this.nodeDescriptions.values()).filter(description =>
      description.group.includes(category)
    );
  }

  searchNodeTypes(searchTerm: string): INodeTypeDescription[] {
    const term = searchTerm.toLowerCase();
    
    return Array.from(this.nodeDescriptions.values()).filter(description =>
      description.displayName.toLowerCase().includes(term) ||
      description.description.toLowerCase().includes(term) ||
      description.name.toLowerCase().includes(term)
    );
  }

  getNodeCategories(): string[] {
    const categories = new Set<string>();
    
    Array.from(this.nodeDescriptions.values()).forEach(description => {
      description.group.forEach(group => categories.add(group));
    });

    return Array.from(categories).sort();
  }

  isValidNodeType(nodeName: string): boolean {
    return this.nodeTypes.has(nodeName);
  }

  getNodeTypeNames(): string[] {
    return Array.from(this.nodeTypes.keys());
  }

  // Dynamic node loading (for future extensibility)
  async loadNodeFromModule(modulePath: string): Promise<void> {
    try {
      // This would be used for loading custom nodes from npm packages
      // For now, we'll keep it as a placeholder
      this.logger.debug(`Loading node module: ${modulePath}`);
      // const nodeModule = await import(modulePath);
      // this.registerNode(nodeModule.default);
    } catch (error) {
      this.logger.error(`Failed to load node module: ${modulePath}`, error);
    }
  }

  // Get node compatibility information
  getNodeCompatibility(nodeName: string): {
    version: number | number[];
    inputs: string[];
    outputs: string[];
    credentials?: string[];
  } | null {
    const description = this.getNodeDescription(nodeName);
    if (!description) {
      return null;
    }

    return {
      version: description.version,
      inputs: description.inputs.map(input => typeof input === 'string' ? input : input.displayName || 'main'),
      outputs: description.outputs.map(output => typeof output === 'string' ? output : output.displayName || 'main'),
      credentials: description.credentials?.map(cred => cred.name) || [],
    };
  }

  // Validate node configuration
  validateNodeConfiguration(nodeName: string, parameters: Record<string, any>): {
    isValid: boolean;
    errors: string[];
  } {
    const description = this.getNodeDescription(nodeName);
    if (!description) {
      return {
        isValid: false,
        errors: [`Unknown node type: ${nodeName}`],
      };
    }

    const errors: string[] = [];

    // Check required parameters
    description.properties.forEach(property => {
      if (property.required && !(property.name in parameters)) {
        errors.push(`Missing required parameter: ${property.name}`);
      }
    });

    // Validate parameter types (basic validation)
    Object.keys(parameters).forEach(paramName => {
      const property = description.properties.find(p => p.name === paramName);
      if (property) {
        const value = parameters[paramName];
        
        // Basic type validation
        switch (property.type) {
          case 'number':
            if (typeof value !== 'number' && isNaN(Number(value))) {
              errors.push(`Parameter ${paramName} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              errors.push(`Parameter ${paramName} must be a boolean`);
            }
            break;
          case 'string':
            if (typeof value !== 'string') {
              errors.push(`Parameter ${paramName} must be a string`);
            }
            break;
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
