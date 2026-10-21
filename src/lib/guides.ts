// A guide for guests: a title and steps, each with text and maybe a photo with marks on it.
/** x and y: the centre, as a share of the photo. w and h (handbook screenshots): a frame of that size instead of a ring. */
export type Mark = { x: number; y: number; label: string; w?: number; h?: number };
export type Step = { text: string; photo: string | null; marks: Mark[] };
export type Guide = { id: number; title: string; steps: Step[]; sort: number };
