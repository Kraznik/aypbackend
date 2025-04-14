import { ponder } from "ponder:registry";
import { balanceHistory } from "ponder:schema";

interface Block {
  number: bigint;
  timestamp: bigint;
}

interface Context {
  db: {
    insert: (table: any) => {
      values: (data: any) => Promise<void>;
    };
  };
  client: {
    getBalance: (params: { address: `0x${string}` }) => Promise<bigint>;
  };
  contracts: {
    SonicContract: {
      address: `0x${string}`;
    };
  };
}

ponder.on("SonicContract:setup", async ({ context }) => {
  const { client, contracts } = context;
  const contractAddress = contracts.SonicContract.address;

  // Get the contract's balance
  const balance = await client.getBalance({
    address: contractAddress,
  });

  console.log(`Contract balance is ${balance}`);

  // Insert the balance into our database
  await context.db.insert(balanceHistory).values({
    id: "initial_balance",
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    balance: balance,
    blockNumber: 0n,
  });
});
