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
    .orderBy(schema.balanceHistory.timestamp.desc)
    .limit(limit)
    .offset(offset);

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
      total: await db.count().from(schema.balanceHistory),
    },
  });
});

// API route to get the latest balance
app.get("/api/latest-balance", async (c) => {
  const latestBalance = await db
    .select()
    .from(schema.balanceHistory)
    .orderBy(schema.balanceHistory.timestamp.desc)
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

app.get("/account/:chainId/:address", async (c) => {
  const chainId = parseInt(c.req.param("chainId"));
  const address = c.req.param("address") as `0x${string}`;

  if (isNaN(chainId)) {
    return c.json({ error: "Invalid chain ID" }, 400);
  }

  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const client = publicClients[chainId as keyof typeof publicClients] as PublicClient;
  if (!client) {
    return c.json({ error: "Chain not supported" }, 400);
  }

  // Get the latest balance for the address
  const latestBalance = await db
    .select()
    .from(schema.balanceHistory)
    .orderBy(sql`${schema.balanceHistory.timestamp} DESC`)
    .limit(1);

  if (!latestBalance || latestBalance.length === 0) {
    return c.json({ error: "No balance data found" }, 404);
  }

  const currentBalance = await client.getBalance({ address });
  const balanceEntry = latestBalance[0];

  if (!balanceEntry) {
    return c.json({ error: "No balance data found" }, 404);
  }

  return c.json({ 
    currentBalance: currentBalance.toString(),
    latestBalance: {
      timestamp: balanceEntry.timestamp.toString(),
      balance: balanceEntry.balance.toString(),
      blockNumber: balanceEntry.blockNumber.toString(),
    }
  });
});

app.get("/hot-trades", async (c) => {
  const oneHourAgo = Date.now() - 1000 * 60 * 60;
  
  const trades = await db
    .select()
    .from(schema.balanceHistory)
    .where(sql`${schema.balanceHistory.timestamp} >= ${oneHourAgo}`)
    .orderBy(sql`${schema.balanceHistory.balance} DESC`)
    .limit(10);

  return c.json({
    data: trades.map(trade => ({
      timestamp: trade.timestamp.toString(),
      balance: trade.balance.toString(),
      blockNumber: trade.blockNumber.toString(),
      date: new Date(Number(trade.timestamp) * 1000).toISOString()
    }))
  });
});

// Create an HTTP server from our Hono app
export default app;
