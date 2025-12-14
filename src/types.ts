export interface Chapter {
  number: number;
  url: string;
  release_date: string;
}

export interface Manga {
  id: string;
  title: string;
  cover_image: string;
  url: string;
  chapters: Chapter[];
  settings: {
    notifications_enabled: boolean;
    last_read_chapter: number;
  };
}
