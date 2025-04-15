export type Room = {
    id: string;
    name: string;
    budget: number;
    deadline: string;
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