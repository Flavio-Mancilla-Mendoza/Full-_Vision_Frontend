import { createContext } from "react";

type ConfirmFn = (message: string) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);
export type { ConfirmFn };
