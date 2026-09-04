export interface CiiuNode {
  code: string;
  description: string;
  children?: CiiuNode[];
}

export declare const ciiuTree: CiiuNode[];
