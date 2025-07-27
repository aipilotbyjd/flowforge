import { Injectable, Logger } from '@nestjs/common';
import { ExpressionEngineService, ExpressionContext } from '@flowforge/workflow-engine/expression-engine';

export interface NodeInputData {
  main?: any[][];
  [connectionType: string]: any[][];
}

export interface NodeOutputData {
  main?: any[][];
  [connectionType: string]: any[][];
}

export interface TransformationContext {
  $json: any;
  $input: {
    all: () => any[];
    first: () => any;
    last: () => any;
    item: (index: number) => any;
    length: number;
  };
  $node: {
    [nodeName: string]: {
      json: any;
      binary?: any;
      parameter?: any;
    };
  };
  $workflow: {
    id: string;
    name: string;
    active: boolean;
  };
  $execution: {
    id: string;
    mode: string;
    resumeUrl?: string;
  };
  $vars: Record<string, any>;
  $parameters: Record<string, any>;
  $binary: Record<string, any>;
  $runIndex: number;
  $itemIndex: number;
}

export interface DataTransformationOptions {
  expressionContext?: Partial<ExpressionContext>;
  continueOnFail?: boolean;
  pairedItem?: {
    item: number;
    input?: number;
  };
  sourceItems?: any[];
  allowEmpty?: boolean;
}

@Injectable()
export class DataTransformationService {
  private readonly logger = new Logger(DataTransformationService.name);

  constructor(private readonly expressionEngine: ExpressionEngineService) {}

  /**
   * Transform input data for a node
   */
  transformInputData(
    inputData: NodeInputData | any[],
    nodeParameters: Record<string, any>,
    context: TransformationContext,
    options: DataTransformationOptions = {}
  ): any[] {
    try {
      // Normalize input data to array format
      const normalizedInput = this.normalizeInputData(inputData);
      
      // If no input data, return empty array or default based on allowEmpty
      if (!normalizedInput || normalizedInput.length === 0) {
        if (options.allowEmpty) {
          return [{}]; // Return single empty item for nodes that can work without input
        }
        return [];
      }

      // Transform each item
      const transformedItems = normalizedInput.map((item, itemIndex) => {
        const itemContext = this.createItemContext(context, item, itemIndex);
        return this.transformItem(item, nodeParameters, itemContext, options);
      });

      this.logger.debug(`Transformed ${transformedItems.length} input items`);
      return transformedItems.filter(item => item !== null && item !== undefined);

    } catch (error) {
      this.logger.error('Failed to transform input data', error);
      if (options.continueOnFail) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Transform output data from a node
   */
  transformOutputData(
    outputData: any | any[],
    nodeParameters: Record<string, any>,
    context: TransformationContext,
    options: DataTransformationOptions = {}
  ): NodeOutputData {
    try {
      let transformedData: any[];

      // Handle different output formats
      if (Array.isArray(outputData)) {
        transformedData = outputData;
      } else if (outputData && typeof outputData === 'object') {
        transformedData = [outputData];
      } else if (outputData !== null && outputData !== undefined) {
        transformedData = [{ data: outputData }];
      } else {
        transformedData = [];
      }

      // Apply transformations based on node configuration
      const processedData = this.processOutputItems(
        transformedData,
        nodeParameters,
        context,
        options
      );

      // Structure as NodeOutputData
      const result: NodeOutputData = {
        main: [processedData],
      };

      this.logger.debug(`Transformed output data: ${processedData.length} items`);
      return result;

    } catch (error) {
      this.logger.error('Failed to transform output data', error);
      if (options.continueOnFail) {
        return { main: [[]] };
      }
      throw error;
    }
  }

  /**
   * Merge data from multiple node inputs
   */
  mergeInputData(
    inputs: NodeInputData,
    mergeMode: 'merge' | 'append' | 'combine' = 'merge'
  ): any[] {
    const allInputs = Object.values(inputs).filter(input => input && input.length > 0);
    
    if (allInputs.length === 0) {
      return [];
    }

    switch (mergeMode) {
      case 'merge':
        // Merge items from all inputs into a single array
        return allInputs.reduce((merged, input) => {
          return merged.concat(input[0] || []);
        }, []);

      case 'append':
        // Append inputs sequentially
        const result: any[] = [];
        allInputs.forEach(input => {
          if (input[0]) {
            result.push(...input[0]);
          }
        });
        return result;

      case 'combine':
        // Combine inputs as separate branches
        return allInputs.map(input => input[0] || []).flat();

      default:
        return allInputs[0][0] || [];
    }
  }

  /**
   * Filter data based on conditions
   */
  filterData(
    data: any[],
    filterExpression: string,
    context: TransformationContext
  ): any[] {
    if (!filterExpression || !data || data.length === 0) {
      return data;
    }

    try {
      return data.filter((item, index) => {
        const itemContext = this.createItemContext(context, item, index);
        const expressionContext = this.contextToExpressionContext(itemContext);
        
        return this.expressionEngine.evaluateExpression(
          filterExpression,
          expressionContext
        );
      });
    } catch (error) {
      this.logger.error('Failed to filter data', error);
      return data; // Return original data on filter error
    }
  }

  /**
   * Sort data based on field and direction
   */
  sortData(
    data: any[],
    sortField: string,
    sortDirection: 'asc' | 'desc' = 'asc'
  ): any[] {
    if (!sortField || !data || data.length === 0) {
      return data;
    }

    try {
      return [...data].sort((a, b) => {
        const aValue = this.getNestedValue(a, sortField);
        const bValue = this.getNestedValue(b, sortField);

        let comparison = 0;
        
        if (aValue < bValue) {
          comparison = -1;
        } else if (aValue > bValue) {
          comparison = 1;
        }

        return sortDirection === 'desc' ? -comparison : comparison;
      });
    } catch (error) {
      this.logger.error('Failed to sort data', error);
      return data; // Return original data on sort error
    }
  }

  /**
   * Paginate data
   */
  paginateData(
    data: any[],
    page: number = 1,
    pageSize: number = 50
  ): {
    items: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return {
      items: data.slice(startIndex, endIndex),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Transform data types
   */
  transformDataTypes(
    data: any[],
    typeMap: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'>
  ): any[] {
    if (!typeMap || Object.keys(typeMap).length === 0) {
      return data;
    }

    return data.map(item => {
      const transformedItem = { ...item };
      
      Object.entries(typeMap).forEach(([field, targetType]) => {
        if (field in transformedItem) {
          transformedItem[field] = this.convertType(transformedItem[field], targetType);
        }
      });

      return transformedItem;
    });
  }

  /**
   * Validate data against schema
   */
  validateData(
    data: any[],
    schema: {
      required?: string[];
      types?: Record<string, string>;
      patterns?: Record<string, string>;
    }
  ): {
    valid: boolean;
    errors: Array<{
      itemIndex: number;
      field: string;
      error: string;
    }>;
  } {
    const errors: Array<{ itemIndex: number; field: string; error: string }> = [];

    data.forEach((item, itemIndex) => {
      // Check required fields
      if (schema.required) {
        schema.required.forEach(field => {
          if (!(field in item) || item[field] === null || item[field] === undefined) {
            errors.push({
              itemIndex,
              field,
              error: `Required field '${field}' is missing`,
            });
          }
        });
      }

      // Check data types
      if (schema.types) {
        Object.entries(schema.types).forEach(([field, expectedType]) => {
          if (field in item) {
            const actualType = typeof item[field];
            if (actualType !== expectedType) {
              errors.push({
                itemIndex,
                field,
                error: `Field '${field}' should be ${expectedType}, but got ${actualType}`,
              });
            }
          }
        });
      }

      // Check patterns (for strings)
      if (schema.patterns) {
        Object.entries(schema.patterns).forEach(([field, pattern]) => {
          if (field in item && typeof item[field] === 'string') {
            const regex = new RegExp(pattern);
            if (!regex.test(item[field])) {
              errors.push({
                itemIndex,
                field,
                error: `Field '${field}' does not match pattern ${pattern}`,
              });
            }
          }
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private normalizeInputData(inputData: NodeInputData | any[]): any[] {
    if (Array.isArray(inputData)) {
      return inputData;
    }
    
    if (inputData && inputData.main && Array.isArray(inputData.main[0])) {
      return inputData.main[0];
    }
    
    return [];
  }

  private createItemContext(
    baseContext: TransformationContext,
    item: any,
    itemIndex: number
  ): TransformationContext {
    return {
      ...baseContext,
      $json: item,
      $itemIndex: itemIndex,
      $input: {
        ...baseContext.$input,
        item: (index: number) => index === itemIndex ? item : baseContext.$input.item(index),
      },
    };
  }

  private transformItem(
    item: any,
    nodeParameters: Record<string, any>,
    context: TransformationContext,
    options: DataTransformationOptions
  ): any {
    try {
      // Apply expressions to the item
      const expressionContext = this.contextToExpressionContext(context);
      const transformedItem = this.expressionEngine.resolveExpressions(
        item,
        expressionContext
      );

      // Apply any parameter-based transformations
      return this.applyParameterTransformations(
        transformedItem,
        nodeParameters,
        context
      );

    } catch (error) {
      this.logger.error(`Failed to transform item at index ${context.$itemIndex}`, error);
      if (options.continueOnFail) {
        return item; // Return original item on transformation error
      }
      throw error;
    }
  }

  private processOutputItems(
    items: any[],
    nodeParameters: Record<string, any>,
    context: TransformationContext,
    options: DataTransformationOptions
  ): any[] {
    return items.map((item, index) => {
      const itemContext = this.createItemContext(context, item, index);
      
      // Add pairedItem information if available
      if (options.pairedItem) {
        return {
          ...item,
          pairedItem: options.pairedItem,
        };
      }

      return item;
    });
  }

  private applyParameterTransformations(
    item: any,
    parameters: Record<string, any>,
    context: TransformationContext
  ): any {
    // Apply parameter-specific transformations
    // This can be extended based on specific node requirements
    
    if (parameters.addFields) {
      // Add additional fields to the item
      parameters.addFields.forEach((field: any) => {
        if (field.name && field.value !== undefined) {
          item[field.name] = field.value;
        }
      });
    }

    if (parameters.removeFields) {
      // Remove specified fields from the item
      parameters.removeFields.forEach((fieldName: string) => {
        delete item[fieldName];
      });
    }

    if (parameters.renameFields) {
      // Rename fields in the item
      parameters.renameFields.forEach((rename: any) => {
        if (rename.from && rename.to && rename.from in item) {
          item[rename.to] = item[rename.from];
          delete item[rename.from];
        }
      });
    }

    return item;
  }

  private contextToExpressionContext(context: TransformationContext): Partial<ExpressionContext> {
    return {
      $json: context.$json,
      $input: context.$input,
      $node: context.$node,
      $workflow: context.$workflow,
      $execution: context.$execution,
      $vars: context.$vars,
      $parameters: context.$parameters,
      $binary: context.$binary,
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private convertType(value: any, targetType: string): any {
    if (value === null || value === undefined) {
      return value;
    }

    try {
      switch (targetType) {
        case 'string':
          return String(value);
        
        case 'number':
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        
        case 'boolean':
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return Boolean(value);
        
        case 'date':
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date;
        
        case 'array':
          return Array.isArray(value) ? value : [value];
        
        case 'object':
          return typeof value === 'object' ? value : { value };
        
        default:
          return value;
      }
    } catch (error) {
      this.logger.warn(`Failed to convert value to ${targetType}:`, error);
      return value;
    }
  }
}
