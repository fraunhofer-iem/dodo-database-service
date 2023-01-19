export interface Release {
  url: string;
  id: number;
  node_id: string;
  name: string;
  created_at: string;
  published_at: string;
  tag_name?: string;
}

export interface Tag {
  name: string;
  commit: { sha: string; url: string };
  node_id: string;
}
