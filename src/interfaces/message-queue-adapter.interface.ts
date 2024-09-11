export interface MessageQueueAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(exchange: string, routingKey: string, message: any): Promise<void>;
  subscribe(exchange: string, routingKey: string, queue: string, callback: (msg: any) => Promise<void>): Promise<void>;
}