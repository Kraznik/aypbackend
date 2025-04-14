import { createConfig } from "ponder";
import { http } from "viem";

// We don't need the UnverifiedContractAbi since we're just tracking balance
// import { UnverifiedContractAbi } from "./abis/UnverifiedContractAbi";

export default createConfig({
  networks: {
    sonic: {
      chainId: 146, // You'll need to fill in the correct chainId for Sonic
      transport: http(
        process.env.PONDER_RPC_URL_SONIC
      ),
    },
  },
  contracts: {
    SonicContract: {
      abi: [], // We don't need a specific ABI to track balance
      address: "0x2f7397fd2d49e5b636ef44503771b17eded67620",
      network: "sonic",
      startBlock: 20137913, // You might want to adjust this to a more recent block
    },
  },
});
