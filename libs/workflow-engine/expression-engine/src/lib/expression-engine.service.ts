import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import * as crypto from 'crypto';
import * as cheerio from 'cheerio';

export interface ExpressionContext {
  $json: any;
  $input: {
    all: () => any[];
    first: () => any;
    last: () => any;
    item: (index: number) => any;
  };
  $node: {
    [key: string]: {
      json: any;
      binary?: any;
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
  $env: Record<string, any>;
  $now: DateTime;
  $today: DateTime;
  $binary: Record<string, any>;
}

interface BuiltInFunction {
  name: string;
  description: string;
  category: 'String' | 'Number' | 'Date' | 'Array' | 'Object' | 'Utility' | 'Crypto';
  implementation: (...args: any[]) => any;
}

@Injectable()
export class ExpressionEngineService {
  private readonly logger = new Logger(ExpressionEngineService.name);
  private readonly builtInFunctions: Map<string, BuiltInFunction> = new Map();

  constructor() {
    this.initializeBuiltInFunctions();
  }

  /**
   * Evaluate an expression string within the given context
   */
  evaluateExpression(expression: string, context: Partial<ExpressionContext>): any {
    try {
      // Remove surrounding {{ }} if present
      const cleanExpression = expression.replace(/^\{\{\s*|\s*\}\}$/g, '');
      
      // Create execution context
      const execContext = this.createExecutionContext(context);
      
      // Replace built-in function calls
      const processedExpression = this.processFunctionCalls(cleanExpression);
      
      // Evaluate the expression
      const result = this.safeEvaluate(processedExpression, execContext);
      
      this.logger.debug(`Expression evaluated: "${cleanExpression}" => ${JSON.stringify(result)}`);
      return result;
      
    } catch (error) {
      this.logger.error(`Expression evaluation failed: "${expression}"`, error);
      throw new Error(`Expression evaluation error: ${error.message}`);
    }
  }

  /**
   * Evaluate multiple expressions in a template string
   */
  evaluateTemplate(template: string, context: Partial<ExpressionContext>): string {
    if (typeof template !== 'string') {
      return template;
    }

    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        const result = this.evaluateExpression(`{{${expression}}}`, context);
        return this.formatResult(result);
      } catch (error) {
        this.logger.warn(`Template expression failed: ${expression}`, error);
        return match; // Return original if evaluation fails
      }
    });
  }

  /**
   * Check if a string contains expressions
   */
  hasExpressions(value: string): boolean {
    if (typeof value !== 'string') return false;
    return /\{\{[^}]+\}\}/.test(value);
  }

  /**
   * Recursively resolve expressions in an object
   */
  resolveExpressions(data: any, context: Partial<ExpressionContext>): any {
    if (typeof data === 'string') {
      if (this.hasExpressions(data)) {
        // If the entire string is a single expression, return the raw result
        const singleExpressionMatch = data.match(/^\{\{(.+)\}\}$/);
        if (singleExpressionMatch) {
          return this.evaluateExpression(data, context);
        }
        // Otherwise, treat as template
        return this.evaluateTemplate(data, context);
      }
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.resolveExpressions(item, context));
    }
    
    if (data && typeof data === 'object') {
      const resolved: any = {};
      for (const [key, value] of Object.entries(data)) {
        resolved[key] = this.resolveExpressions(value, context);
      }
      return resolved;
    }
    
    return data;
  }

  /**
   * Get available built-in functions
   */
  getBuiltInFunctions(): BuiltInFunction[] {
    return Array.from(this.builtInFunctions.values());
  }

  /**
   * Validate expression syntax
   */
  validateExpression(expression: string): { valid: boolean; error?: string } {
    try {
      const cleanExpression = expression.replace(/^\{\{\s*|\s*\}\}$/g, '');
      
      // Basic syntax validation
      if (cleanExpression.includes('eval(') || cleanExpression.includes('Function(')) {
        return { valid: false, error: 'Unsafe functions not allowed' };
      }
      
      // Try to parse with a minimal context
      this.safeEvaluate(cleanExpression, { $json: {} });
      return { valid: true };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  private createExecutionContext(context: Partial<ExpressionContext>): any {
    const now = DateTime.now();
    
    return {
      // Core context objects
      $json: context.$json || {},
      $input: context.$input || {
        all: () => [],
        first: () => null,
        last: () => null,
        item: (index: number) => null,
      },
      $node: context.$node || {},
      $workflow: context.$workflow || {
        id: 'unknown',
        name: 'Unknown Workflow',
        active: true,
      },
      $execution: context.$execution || {
        id: 'unknown',
        mode: 'manual',
      },
      $vars: context.$vars || {},
      $parameters: context.$parameters || {},
      $env: context.$env || process.env,
      $now: now,
      $today: now.startOf('day'),
      $binary: context.$binary || {},
      
      // Built-in functions
      ...Object.fromEntries(
        Array.from(this.builtInFunctions.entries()).map(([name, func]) => [
          name,
          func.implementation,
        ])
      ),
      
      // Additional utilities
      Math: Math,
      parseInt: parseInt,
      parseFloat: parseFloat,
      isNaN: isNaN,
      isFinite: isFinite,
      encodeURIComponent: encodeURIComponent,
      decodeURIComponent: decodeURIComponent,
      JSON: JSON,
      DateTime: DateTime,
    };
  }

  private safeEvaluate(expression: string, context: any): any {
    // Create a new function with the context as parameters
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);
    
    try {
      const func = new Function(...contextKeys, `"use strict"; return (${expression});`);
      return func(...contextValues);
    } catch (error) {
      throw new Error(`Invalid expression: ${error.message}`);
    }
  }

  private processFunctionCalls(expression: string): string {
    // This could be enhanced to handle more complex function preprocessing
    return expression;
  }

  private formatResult(result: any): string {
    if (result === null || result === undefined) {
      return '';
    }
    if (typeof result === 'object') {
      return JSON.stringify(result);
    }
    return String(result);
  }

  private initializeBuiltInFunctions(): void {
    // String functions
    this.builtInFunctions.set('length', {
      name: 'length',
      description: 'Get the length of a string or array',
      category: 'String',
      implementation: (value: string | any[]) => value ? value.length : 0,
    });

    this.builtInFunctions.set('upper', {
      name: 'upper',
      description: 'Convert string to uppercase',
      category: 'String',
      implementation: (str: string) => str ? str.toUpperCase() : '',
    });

    this.builtInFunctions.set('lower', {
      name: 'lower',
      description: 'Convert string to lowercase',
      category: 'String',
      implementation: (str: string) => str ? str.toLowerCase() : '',
    });

    this.builtInFunctions.set('trim', {
      name: 'trim',
      description: 'Remove whitespace from both ends of string',
      category: 'String',
      implementation: (str: string) => str ? str.trim() : '',
    });

    this.builtInFunctions.set('split', {
      name: 'split',
      description: 'Split string by delimiter',
      category: 'String',
      implementation: (str: string, delimiter: string) => str ? str.split(delimiter) : [],
    });

    this.builtInFunctions.set('replace', {
      name: 'replace',
      description: 'Replace occurrences in string',
      category: 'String',
      implementation: (str: string, search: string, replace: string) => 
        str ? str.replace(new RegExp(search, 'g'), replace) : '',
    });

    this.builtInFunctions.set('substring', {
      name: 'substring',
      description: 'Extract substring',
      category: 'String',
      implementation: (str: string, start: number, end?: number) => 
        str ? str.substring(start, end) : '',
    });

    // Number functions
    this.builtInFunctions.set('round', {
      name: 'round',
      description: 'Round number to specified decimal places',
      category: 'Number',
      implementation: (num: number, decimals: number = 0) => {
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
      },
    });

    this.builtInFunctions.set('floor', {
      name: 'floor',
      description: 'Round down to nearest integer',
      category: 'Number',
      implementation: (num: number) => Math.floor(num),
    });

    this.builtInFunctions.set('ceil', {
      name: 'ceil',
      description: 'Round up to nearest integer',
      category: 'Number',
      implementation: (num: number) => Math.ceil(num),
    });

    this.builtInFunctions.set('abs', {
      name: 'abs',
      description: 'Get absolute value',
      category: 'Number',
      implementation: (num: number) => Math.abs(num),
    });

    this.builtInFunctions.set('min', {
      name: 'min',
      description: 'Get minimum value from array',
      category: 'Number',
      implementation: (...args: number[]) => Math.min(...args),
    });

    this.builtInFunctions.set('max', {
      name: 'max',
      description: 'Get maximum value from array',
      category: 'Number',
      implementation: (...args: number[]) => Math.max(...args),
    });

    // Date functions
    this.builtInFunctions.set('now', {
      name: 'now',
      description: 'Get current timestamp',
      category: 'Date',
      implementation: () => new Date().toISOString(),
    });

    this.builtInFunctions.set('dateFormat', {
      name: 'dateFormat',
      description: 'Format date using Luxon format',
      category: 'Date',
      implementation: (date: string | Date, format: string) => {
        const dt = DateTime.fromJSDate(new Date(date));
        return dt.toFormat(format);
      },
    });

    this.builtInFunctions.set('dateAdd', {
      name: 'dateAdd',
      description: 'Add time to date',
      category: 'Date',
      implementation: (date: string | Date, amount: number, unit: string) => {
        const dt = DateTime.fromJSDate(new Date(date));
        return dt.plus({ [unit]: amount }).toJSDate();
      },
    });

    this.builtInFunctions.set('dateDiff', {
      name: 'dateDiff',
      description: 'Get difference between dates',
      category: 'Date',
      implementation: (date1: string | Date, date2: string | Date, unit: string = 'days') => {
        const dt1 = DateTime.fromJSDate(new Date(date1));
        const dt2 = DateTime.fromJSDate(new Date(date2));
        return dt2.diff(dt1, unit as any).as(unit as any);
      },
    });

    // Array functions
    this.builtInFunctions.set('first', {
      name: 'first',
      description: 'Get first element of array',
      category: 'Array',
      implementation: (arr: any[]) => arr && arr.length > 0 ? arr[0] : null,
    });

    this.builtInFunctions.set('last', {
      name: 'last',
      description: 'Get last element of array',
      category: 'Array',
      implementation: (arr: any[]) => arr && arr.length > 0 ? arr[arr.length - 1] : null,
    });

    this.builtInFunctions.set('sum', {
      name: 'sum',
      description: 'Sum array of numbers',
      category: 'Array',
      implementation: (arr: number[]) => arr ? arr.reduce((sum, num) => sum + num, 0) : 0,
    });

    this.builtInFunctions.set('average', {
      name: 'average',
      description: 'Calculate average of array',
      category: 'Array',
      implementation: (arr: number[]) => arr && arr.length > 0 ? arr.reduce((sum, num) => sum + num, 0) / arr.length : 0,
    });

    this.builtInFunctions.set('unique', {
      name: 'unique',
      description: 'Get unique values from array',
      category: 'Array',
      implementation: (arr: any[]) => arr ? [...new Set(arr)] : [],
    });

    this.builtInFunctions.set('sort', {
      name: 'sort',
      description: 'Sort array',
      category: 'Array',
      implementation: (arr: any[], key?: string) => {
        if (!arr) return [];
        if (key) {
          return [...arr].sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          });
        }
        return [...arr].sort();
      },
    });

    // Object functions
    this.builtInFunctions.set('keys', {
      name: 'keys',
      description: 'Get object keys',
      category: 'Object',
      implementation: (obj: object) => obj ? Object.keys(obj) : [],
    });

    this.builtInFunctions.set('values', {
      name: 'values',
      description: 'Get object values',
      category: 'Object',
      implementation: (obj: object) => obj ? Object.values(obj) : [],
    });

    this.builtInFunctions.set('isEmpty', {
      name: 'isEmpty',
      description: 'Check if value is empty',
      category: 'Utility',
      implementation: (value: any) => {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.length === 0;
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
      },
    });

    this.builtInFunctions.set('isNull', {
      name: 'isNull',
      description: 'Check if value is null or undefined',
      category: 'Utility',
      implementation: (value: any) => value === null || value === undefined,
    });

    // Crypto functions
    this.builtInFunctions.set('hash', {
      name: 'hash',
      description: 'Generate hash of string',
      category: 'Crypto',
      implementation: (text: string, algorithm: string = 'sha256') => {
        return crypto.createHash(algorithm).update(text).digest('hex');
      },
    });

    this.builtInFunctions.set('uuid', {
      name: 'uuid',
      description: 'Generate UUID v4',
      category: 'Crypto',
      implementation: () => crypto.randomUUID(),
    });

    this.builtInFunctions.set('randomInt', {
      name: 'randomInt',
      description: 'Generate random integer between min and max',
      category: 'Utility',
      implementation: (min: number, max: number) => 
        Math.floor(Math.random() * (max - min + 1)) + min,
    });

    this.builtInFunctions.set('randomFloat', {
      name: 'randomFloat',
      description: 'Generate random float between min and max',
      category: 'Utility',
      implementation: (min: number = 0, max: number = 1) => 
        Math.random() * (max - min) + min,
    });
  }
}
