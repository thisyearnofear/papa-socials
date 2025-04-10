declare module "web3.storage" {
  export interface PutOptions {
    name?: string;
    maxRetries?: number;
    wrapWithDirectory?: boolean;
  }

  export class Web3Storage {
    constructor(options: { token: string });
    put(files: File[], options?: PutOptions): Promise<string>;
    get(cid: string): Promise<any>;
    delete(cid: string): Promise<void>;
    status(cid: string): Promise<any>;
  }
}
