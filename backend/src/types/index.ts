export interface Book {
    id: string;
    name: string;
    color: string;
    icon: string;
    created_at: string;
    updated_at: string;
}

export interface Section {
    id: string;
    book_id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Note {
    id: string;
    section_id: string;
    book_id: string;
    title: string;
    content: string;
    tags: string;
    created_at: string;
    updated_at: string;
}

export interface Presentation {
    id: string;
    note_id: string;
    version: number;
    short_summary: string;
    extended_summary: string;
    associations: string; // JSON string
    mermaid_map: string;
    story: string;
    image_url: string | null;
    created_at: string;
}

export interface GenerateRequest {
    note_id: string;
    content: string;
    title: string;
}

export interface GenerateResponse {
    success: boolean;
    presentation?: Presentation;
    error?: string;
}

export interface Association {
    concept: string;
    association: string;
    mnemonic: string;
}
