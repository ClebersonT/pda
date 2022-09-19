import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import * as BufferLayout from "@solana/buffer-layout"; 

import * as fs from "fs";

export const logError = (msg: string) => {
  console.log(`\x1b[31m${msg}\x1b[0m`);
};

export const writePublicKey = (publicKey: PublicKey, name: string) => {
  fs.writeFileSync(
    `./keys/${name}_pub.json`,
    JSON.stringify(publicKey.toString())
  );
};

export const getPublicKey = (name: string) =>
  new PublicKey(
    JSON.parse(fs.readFileSync(`./keys/${name}_pub.json`) as unknown as string)
  );

export const getPrivateKey = (name: string) =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(`./keys/${name}.json`) as unknown as string)
  );

export const getKeypair = (name: string) =>
  new Keypair({
    publicKey: getPublicKey(name).toBytes(),
    secretKey: getPrivateKey(name),
  });

export const getProgramId = () => {
  try {
    return getPublicKey("program");
  } catch (e) {
    logError("Given programId is missing or incorrect");
    process.exit(1);
  }
};

export const getTokenBalance = async (
  pubkey: PublicKey,
  connection: Connection
) => {
  return parseInt(
    (await connection.getTokenAccountBalance(pubkey)).value.amount
  );
};

/**
 * Layout for a public key
 */
const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
};

/**
 * Layout for a 64bit unsigned value
 */
const uint64 = (property = "uint64") => {
  return BufferLayout.blob(8, property);
};

/*export const ESCROW_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
  BufferLayout.u8("isInitialized"),
  publicKey("initializerPubkey"),
  publicKey("initializerTempTokenAccountPubkey"),
  publicKey("initializerReceivingTokenAccountPubkey"),
  uint64("expectedAmount"),
]);*/

export interface EscrowLayout {
  isInitialized: number;
  initializerPubkey: Uint8Array;
  initializerReceivingTokenAccountPubkey: Uint8Array;
  initializerTempTokenAccountPubkey: Uint8Array;
  expectedAmount: Uint8Array;
}

export const ESCROW_ACCOUNT_DATA_LAYOUT = BufferLayout.struct<
Readonly<{
    isInitialized: number;
    initializerPubkey: Uint8Array;
    initializerReceivingTokenAccountPubkey: Uint8Array;
    initializerTempTokenAccountPubkey: Uint8Array;
    expectedAmount: Uint8Array;
}>
>([
    BufferLayout.u8("isInitialized"),
    publicKey("initializerPubkey"),
    publicKey("initializerTempTokenAccountPubkey"),
    publicKey("initializerReceivingTokenAccountPubkey"),
    uint64("expectedAmount"),
]);



export const generateKeypairLocal = (name: string) => {
    let wallet = Keypair.generate();
    fs.writeFileSync(
      `./keys/${name}_pub.json`,
      JSON.stringify(wallet.publicKey.toString())
    );
    fs.writeFileSync(
        `./keys/${name}.json`,
        "["+wallet.secretKey+"]"
    );
    /*let firstWinPrivKey =  wallet.secretKey
    .slice(0,32);
    let firstWinWallet = Keypair.fromSeed(Uint8Array.from(firstWinPrivKey));*/
};

export const getFile = (name: string) => {
    const pathPri = `./keys/${name}.json`;
    const pathPub = `./keys/${name}_pub.json`;
    if(!fs.existsSync(pathPri) || !fs.existsSync(pathPub)){
        return false;
    }
    return true
}
export const getFileBrz = (name: string) => {
  const pathPub = `./keys/${name}_pub.json`;
  if(!fs.existsSync(pathPub)){
      return false;
  }
  return true
}
export const getBalance =async (
    pubkey: PublicKey,
    connection: Connection
  ) => {
    let balance = await connection.getBalance(pubkey);
    return balance;
    //console.log(`${balance / LAMPORTS_PER_SOL} SOL`);
  };
  