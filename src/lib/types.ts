export type VoteChoice = 'yes' | 'no';

export interface Item {
  id: string;
  label: string;
  description: string;
  image_url: string;
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
}

export interface ItemResult {
  id: string;
  label: string;
  description: string;
  image_url: string;
  yes_count: number;
  no_count: number;
  total_votes: number;
}

export type ResultsSort = 'most_loved' | 'most_divisive' | 'most_skipped';

export interface LastVote {
  itemId: string;
  choice: VoteChoice;
  voteId: string;
}
