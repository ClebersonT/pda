import * as anchor from "@project-serum/anchor";
import { Pdas } from "../target/types/pdas";
import { Connection, PublicKey, Transaction, LAMPORTS_PER_SOL, Signer } from "@solana/web3.js";
import { getFileBrz, getBalance, getFile, generateKeypairLocal, ESCROW_ACCOUNT_DATA_LAYOUT, getKeypair, getPublicKey, getTokenBalance, logError, writePublicKey, } from "../src/utils";

const connection = new Connection("http://localhost:8899", "confirmed");

//para que possa imprimir no console
function shortKey(key: anchor.web3.PublicKey){
  return key.toString().substring(0, 8);
}

describe("pdas", () => {

  const provider = anchor.AnchorProvider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);
  const program = anchor.workspace.Pdas as anchor.Program<Pdas>;

  //first function test
  async function generateKeypair(){
    let keypair = anchor.web3.Keypair.generate();
    await provider.connection.requestAirdrop(
      keypair.publicKey,
      2* anchor.web3.LAMPORTS_PER_SOL
    );
    await new Promise( resolve =>  setTimeout(resolve, 3 * 1000)); //sleep
    return keypair;
  }

  //retorna o PDA associado
  async function derivePda(treasure: string, pubKey: anchor.web3.PublicKey){
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        pubKey.toBuffer(),
        Buffer.from("_"),
        Buffer.from(treasure)
      ],
      program.programId
    );
    return pda;
  }

  //criar contabil
  async function createTreasureAccount(
    treasure: string,
    pda: anchor.web3.PublicKey,
    wallet: anchor.web3.Keypair){

        await program.methods.createTreasure(treasure,0,0,0,0,0,0,0,0)
        .accounts({
          treasureAccount: pda,
          wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc()
  }

  async function getDatabase(
    treasure: string,
    wallet: anchor.web3.Keypair
  ){
    console.log("--------------------------------------------------")
    let data;
    let pda = await derivePda("treasure", wallet.publicKey);

    console.log(`Checking if account ${shortKey(pda)} exists for treasure...`)
    try {
      data = await program.account.database.fetch(pda);
      console.log("Its does.")
    } catch (error) {
      console.log("It does Not. Creating...");
      await createTreasureAccount("treasure", pda, wallet);
      data = await program.account.database.fetch(pda);
    };

    console.log("Success.");
    console.log("Data." + JSON.stringify(data));
  }

  it("Is initialized!", async () => {
    // Add your test here.
    //keypair CattleProgram
    let exist = getFile("cattleProgram-keypair");
    if(!exist){generateKeypairLocal("cattleProgram-keypair")}
    const CattleProgramKeypair = getKeypair("cattleProgram-keypair");

    console.log("Requesting SOL for treasure...");
    await connection.requestAirdrop(CattleProgramKeypair.publicKey, LAMPORTS_PER_SOL * 10);
    await new Promise( resolve =>  setTimeout(resolve, 1000)); //sleep
    let balance= await getBalance(CattleProgramKeypair.publicKey, connection);
    console.log("BALANCE SOL TREASURE "+ CattleProgramKeypair.publicKey +": "+ `${ balance / LAMPORTS_PER_SOL} SOL`);

    await getDatabase("treasure", CattleProgramKeypair);

  });
});
