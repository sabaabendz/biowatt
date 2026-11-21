export interface NodeInfo {
  id: string;
  name: string;
  type: 'residential' | 'canal' | 'outfall' | 'marine';
  src: 'live' | 'sim';
  location: string;
  lat: number;
  lng: number;
  valve_state: 'open' | 'lock';
  last_seen: number;
}

export interface TelemetryData {
  node: string;
  ts: number;
  v_mv: number;
  i_ua: number;
  p_uw: number;
  e_mwh: number;
  turb_ntu: number | null;
  src: 'live' | 'sim';
}

export interface InsightData {
  node: string;
  ts: number;
  bod_mgl: number;
  cod_destroyed_mg: number;
  liters_treated: number;
  irrigation_score: number;
  swim_index: number;
  toxic: boolean;
  recommended_interval_s: number;
  model: string;
  label: string;
  hours_until_unsafe: number | null;
}

export interface EventData {
  id?: number;
  node: string;
  ts: number;
  type: 'TOXIC_SHOCK' | 'VALVE_LOCK' | 'SAFE' | 'FEED';
  detail: string;
}

export interface StimulusResponse {
  success: boolean;
  node: string;
  kind: 'food' | 'toxic' | 'reset';
  multiplier?: number;
}

