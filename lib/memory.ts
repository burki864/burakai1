export interface UserMemory {
  preferences: Record<string, any>;
  topics: string[];
  lastUsed: string;
}

export const memoryStore = {
  get: (userId: string): UserMemory => {
    // In a real app, this would be Redis or a DB
    // For this demo, we use a global object (not persistent across serverless restarts)
    // or we can use localStorage on the client side.
    // Since this is lib code for the backend, we'll simulate it.
    return {
      preferences: {},
      topics: [],
      lastUsed: new Date().toISOString(),
    };
  },
  update: (userId: string, data: Partial<UserMemory>) => {
    console.log(`Updating memory for ${userId}`, data);
  }
};
