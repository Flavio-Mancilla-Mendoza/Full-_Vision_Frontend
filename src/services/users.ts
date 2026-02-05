// Wrapper service for user management to keep components UI-only.
import * as admin from "./admin";

export type CreateUserData = {
  email: string;
  password: string;
  full_name: string;
  role: "admin" | "customer";
  phone?: string;
};

export type UpdateUserData = Partial<admin.UserProfile>;

export async function getAllUsersPaginated(page = 1, limit = 50, filters: { search?: string } = {}) {
  return admin.getAllUsersPaginated(page, limit, filters);
}

export async function createUser(userData: CreateUserData) {
  // Centralize error handling / logging if needed
  try {
    return await admin.createUser(userData);
  } catch (err) {
    console.error("User service: createUser error", err);
    throw err;
  }
}

export async function updateUser(userId: string, updates: UpdateUserData) {
  try {
    return await admin.updateUser(userId, updates);
  } catch (err) {
    console.error("User service: updateUser error", err);
    throw err;
  }
}

export async function deactivateUser(userId: string) {
  try {
    return await admin.deactivateUser(userId);
  } catch (err) {
    console.error("User service: deactivateUser error", err);
    throw err;
  }
}

export * from "./admin"; // re-export other admin helpers if needed
