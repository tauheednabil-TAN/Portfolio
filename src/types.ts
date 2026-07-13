export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  category: "about" | "education" | "skills" | "projects" | "experience" | "faq" | "other";
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  body_md: string;
  image_url: string;
  tags: string[];
  published: boolean;
  created_at: string;
}

export interface RoadmapNode {
  id: string;
  parent_id: string | null;
  title: string;
  description: string;
  status: "done" | "in_progress" | "planned";
  sort_order: number;
  icon: string;
  date_label: string;
  children?: RoadmapNode[];
}

export type BookingStatus = "pending" | "confirmed" | "declined" | "expired";

export interface Booking {
  id: string;
  visitor_name: string;
  visitor_email: string;
  note: string;
  mode: "meet" | "in_person";
  start_ts: string; // ISO String
  end_ts: string;   // ISO String
  status: BookingStatus;
  approval_token: string;
  gcal_event_id: string | null;
  created_at: string;
}

export interface Settings {
  availabilityHoursStart: string; // "10:00"
  availabilityHoursEnd: string;   // "18:00"
  timezone: string;               // "Europe/Copenhagen"
  myEmail: string;                // Nabil's email
  inPersonLocation: string;       // Copenhagen text
}

export interface DBStore {
  knowledge_chunks: KnowledgeChunk[];
  posts: BlogPost[];
  roadmap_nodes: RoadmapNode[];
  bookings: Booking[];
  settings: Settings;
}

export type SceneState =
  | "welcome"
  | "idle"
  | "listening"
  | "thinking"
  | "talking"
  | "coffee_invite"
  | "celebrate"
  | "confused";
