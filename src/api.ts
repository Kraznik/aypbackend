import { Hono } from "hono";
import { db, publicClients } from "ponder:api";
import schema from "ponder:schema";
import { eq, desc, sql } from "drizzle-orm";
import type { PublicClient } from "viem";
import { isAddress } from "viem";

const app = new Hono();

// API route to get balance history
app.get("/api/balance-history", async (c) => {
  // Optional query parameters
  const limit = Number(c.req.query("limit") || "100");
  const offset = Number(c.req.query("offset") || "0");

  // Get balance history from the database
  const balanceHistory = await db
    .select()
    .from(schema.balanceHistory)
    .orderBy(desc(schema.balanceHistory.timestamp))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const totalResult = await db
    .select({ count: sql`count(*)` })
    .from(schema.balanceHistory);
  const total = Number(totalResult[0]?.count || 0);

  return c.json({
    data: balanceHistory.map((entry) => ({
      timestamp: entry.timestamp.toString(),
      balance: entry.balance.toString(),
      blockNumber: entry.blockNumber.toString(),
      // Convert timestamp to Date for easier frontend use
      date: new Date(Number(entry.timestamp) * 1000).toISOString(),
    })),
    pagination: {
      limit,
      offset,
      total,
    },
  });
});

// API route to get the latest balance
app.get("/api/latest-balance", async (c) => {
  const latestBalance = await db
    .select()
    .from(schema.balanceHistory)
    .orderBy(desc(schema.balanceHistory.timestamp))
    .limit(1);

  if (latestBalance.length === 0) {
    return c.json({ error: "No balance data found" }, 404);
  }

  const latestBalanceEntry = latestBalance[0];

  return c.json({
    timestamp: latestBalanceEntry.timestamp.toString(),
    balance: latestBalanceEntry.balance.toString(),
    blockNumber: latestBalanceEntry.blockNumber.toString(),
    date: new Date(Number(latestBalanceEntry.timestamp) * 1000).toISOString(),
  });
});

app.get("/api/account/:chainId/:address", async (c) => {
  const chainId = parseInt(c.req.param("chainId"));
  const address = c.req.param("address") as `0x${string}`;

  if (isNaN(chainId)) {
    return c.json({ error: "Invalid chain ID" }, 400);
  }

  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const client = publicClients[
    chainId as keyof typeof publicClients
  ] as PublicClient;
  if (!client) {
    return c.json({ error: "Chain not supported" }, 400);
  }

  try {
    // Get the current balance for the address
    const currentBalance = await client.getBalance({ address });

    return c.json({
      address,
      chainId,
      currentBalance: currentBalance.toString(),
    });
  } catch (error) {
    console.error("Error fetching account balance:", error);
    return c.json({ error: "Failed to fetch account balance" }, 500);
  }
});

app.get("/api/hot-trades", async (c) => {
  try {
    const oneHourAgo = BigInt(Math.floor(Date.now() / 1000) - 60 * 60);

    const trades = await db
      .select()
      .from(schema.balanceHistory)
      .where(sql`${schema.balanceHistory.timestamp} >= ${oneHourAgo}`)
      .orderBy(desc(schema.balanceHistory.balance))
      .limit(10);

    return c.json({
      data: trades.map((trade) => ({
        timestamp: trade.timestamp.toString(),
        balance: trade.balance.toString(),
        blockNumber: trade.blockNumber.toString(),
        date: new Date(Number(trade.timestamp) * 1000).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching hot trades:", error);
    return c.json({ error: "Failed to fetch hot trades" }, 500);
  }
});

// Create an HTTP server from our Hono app
export default app;
