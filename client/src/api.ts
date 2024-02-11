interface SearchReplaysParameters {
  page?: number;
  rating?: number;
  format?: string;
  username?: string;
  username2?: string;
  order?: string;
}

export interface Replay {
  id: string;
	p1: string;
	p2: string;
	format: string;
	uploadtime: number;
	rating: number;
}

export const searchReplays = async (params: SearchReplaysParameters): Promise<Replay[]> => {
  try {
    const result = await fetch('/replays/search.json?' + new URLSearchParams(params as Record<string, string>));
    return result.json();
  } catch {}

  return []
};
