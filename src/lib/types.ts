export type House = {
    id: string;
    name: string;
    address?: string;
    photo?: string;  // Optional base64 or URL for the house photo
    createdAt?: string;
    updatedAt?: string;
};

export type Room = {
    id: string;
    houseId: string;  // Reference to the parent house
    name: string;
    budget: number;
    deadline: string;
    thumbnail?: string; // Optional base64 or URL for the room thumbnail
    photos: string[]; // base64 or URL
    tasks: Task[];
    createdAt?: string;
    updatedAt?: string;
};

export type Task = {
    id: string;
    title: string;
    done: boolean;
    note?: string;
    cost?: number;
    createdAt?: string;
    updatedAt?: string;
};

export type User = {
    id: string;
    email: string;
    password: string; // This will store a hashed password, not plaintext
    name: string;
    createdAt?: string;
    updatedAt?: string;
}; 