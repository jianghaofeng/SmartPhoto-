declare module "negotiator" {
  interface NegotiatorOptions {
    headers: Record<string, string>;
  }

  export default class Negotiator {
    constructor(options: NegotiatorOptions);
    charset(): string[];
    encoding(): string[];
    languages(): string[];
    mediaType(): string[];
  }
}
