import { onchainTable } from "ponder";

export const balanceHistory = onchainTable("balanceHistory", (t) => ({
  id: t.text().primaryKey(),
  timestamp: t.bigint().notNull(),
  balance: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
}));
