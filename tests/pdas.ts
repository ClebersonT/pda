import * as anchor from "@project-serum/anchor";
import { Pdas } from "../target/types/pdas";

//para que possa imprimir no console
function shortKey(key: anchor.web3.PublicKey){
  return key.toString().substring(0, 8);
}

describe("pdas", () => {

  const provider = anchor.AnchorProvider.env() 
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
  async function derivePda(color: string, pubKey: anchor.web3.PublicKey){
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        pubKey.toBuffer(),
        Buffer.from("_"),
        Buffer.from(color)
      ],
      program.programId
    );
    return pda;
  }

  //criar contabil
  async function createLedgerAccount(
    color: string,
    pda: anchor.web3.PublicKey,
    wallet: anchor.web3.Keypair){

        await program.methods.createLedger(color)
        .accounts({
          ledgerAccount: pda,
          wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc()
  }

  async function modifyLedger(
    color: string,
    newBalance: number,
    wallet: anchor.web3.Keypair
  ){
    console.log("--------------------------------------------------")
    let data;
    let pda = await derivePda(color, wallet.publicKey);

    console.log(`Checking if account ${shortKey(pda)} exists for color: ${color}...`)
    try {
      data = await program.account.ledger.fetch(pda);
      console.log("Its does.")
    } catch (error) {
      console.log("It does Not. Creating...");
      await createLedgerAccount(color, pda, wallet);
      data = await program.account.ledger.fetch(pda);
    };

    console.log("Success.");
    console.log("Data.");
    console.log(`Color: ${data.color}   Balance: ${data.balance}`);
    console.log(`Modifying balance of ${data.color} from  ${data.balance} to ${newBalance}`);


    await program.methods.modifyLedger(newBalance).accounts({
      ledgerAccount: pda,
      wallet: wallet.publicKey,
    })
    .signers([wallet])
    .rpc();

    data = await program.account.ledger.fetch(pda);
    console.log("New Data.");
    console.log(`Color: ${data.color}   Balance: ${data.balance}`);
    console.log("Success.");
  }


  it("Is initialized!", async () => {
    // Add your test here.
    //const tx = await program.methods.initialize().rpc();
    //console.log("Your transaction signature", tx);

    const testKeypair1 = await generateKeypair();
    await modifyLedger("red",  2, testKeypair1);
    await modifyLedger("red",  4, testKeypair1);
    await modifyLedger("blue",  2, testKeypair1);

    const testKeypair2 = await generateKeypair();
    await modifyLedger("red",  3, testKeypair2);
    await modifyLedger("green",  3, testKeypair2);

  });
});
