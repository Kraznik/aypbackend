import { createConfig } from "ponder";
import { http } from "viem";

export default createConfig({
  networks: {
    sonic: {
      chainId: 146, // Sonic Chain ID
      transport: http(process.env.PONDER_RPC_URL_SONIC),
    },
  },
  contracts: {
    SonicContract: {
      abi: [], // Empty ABI is fine for balance tracking
      address: "0x2f7397fd2d49e5b636ef44503771b17eded67620",
      network: "sonic",
      startBlock: 20137913,
    },
  },
});
