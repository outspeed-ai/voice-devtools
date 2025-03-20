export interface OaiEvent {
  type: string;
  server_sent?: boolean;
  timestamp?: string;
  id?: string;
  event_id?: string;
  [key: string]: any;
}
