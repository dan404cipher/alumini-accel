declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  const xss: () => RequestHandler;
  export default xss;
}

declare module 'hpp' {
  import { RequestHandler } from 'express';
  const hpp: () => RequestHandler;
  export default hpp;
} 