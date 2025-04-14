import { ponder } from "ponder:registry";
import { balanceHistory } from "ponder:schema";

ponder.on("SonicContract:setup", async ({ context }) => {
  const { client, contracts } = context;
  const contractAddress = contracts.SonicContract.address;

  // Get the contract's balance
  const balance = await client.getBalance({
    address: contractAddress,
  });

  console.log(`Initial contract balance is ${balance}`);

  // Insert the balance into our database
  await context.db.insert(balanceHistory).values({
    id: `balance_setup_${Date.now()}`,
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    balance: balance,
    blockNumber: 0n,
  });
});

// Add a block handler to track balance changes
ponder.on("block", async ({ block, context }) => {
  const { client, contracts } = context;
  const contractAddress = contracts.SonicContract.address;

  const balance = await client.getBalance({
    address: contractAddress,
    blockTag: block.number, // optional but more precise
  });

  const id = `balance_${block.number}_${block.timestamp}`;

  console.log(`Block ${block.number}: Contract balance is ${balance}`);

  await context.db.insert(balanceHistory).values({
    id,
    timestamp: block.timestamp,
    balance,
    blockNumber: block.number,
  });
});
