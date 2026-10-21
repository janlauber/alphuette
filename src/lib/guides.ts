// A guide for guests: a title and steps, each with text and maybe a photo with marks on it.
export type Mark = { x: number; y: number; label: string };
export type Step = { text: string; photo: string | null; marks: Mark[] };
export type Guide = { id: number; title: string; steps: Step[]; sort: number };
