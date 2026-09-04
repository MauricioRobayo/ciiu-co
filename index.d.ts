export interface CiiuNode {
  code: string;
  description: string;
  children?: CiiuNode[];
}

export declare const ciiuDict: Record<string, string>;
export declare const ciiuTree: CiiuNode[];
export declare function isCiiuCode(code: string): boolean;
