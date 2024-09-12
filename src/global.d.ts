declare module 'debug' {
  function debug(namespace: string): debug.Debugger;
  namespace debug {
    interface Debugger {
      (formatter: any, ...args: any[]): void;
      enabled: boolean;
      namespace: string;
    }
  }
  export = debug;
}