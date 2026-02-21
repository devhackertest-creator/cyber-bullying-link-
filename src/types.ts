export interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: number;
  isBullying: boolean;
  score: number;
  confidence: number;
  label: string;
  primaryType?: string;
  isReported?: boolean;
}

export interface Post {
  id: string;
  username: string;
  avatar: string;
  imageUrl: string;
  caption: string;
  likes: number;
  timestamp: number;
  comments: Comment[];
}

export interface AppState {
  posts: Post[];
  isDarkMode: boolean;
  isAdmin: boolean;
}
