export type Movie = {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  backdrop_url: string | null;
  video_url: string;
  category: string;
  genre: string | null;
  year: number | null;
  duration_minutes: number | null;
  featured: boolean;
  created_at: string;
};

export type Artist = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  cover_url: string | null;
  genre: string | null;
  featured: boolean;
  created_at: string;
};

export type Track = {
  id: string;
  artist_id: string;
  title: string;
  audio_url: string;
  video_url: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  release_year: number | null;
  created_at: string;
  spotify_url?: string | null;
};

export type Merch = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  category: string | null;
  artist_id: string | null;
  in_stock: boolean;
  external_url: string | null;
  created_at: string;
};
