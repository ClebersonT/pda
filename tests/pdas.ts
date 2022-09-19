import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  AccountLayout,
} from "@solana/spl-token"; 

import { assert } from "chai";
import * as anchor from "@project-serum/anchor";
import { Pdas } from "../target/types/pdas";
import { Connection, PublicKey } from "@solana/web3.js";
import { getFileBrz, getBalance, getFile, generateKeypairLocal, ESCROW_ACCOUNT_DATA_LAYOUT, getKeypair, getPublicKey, getTokenBalance, logError, writePublicKey, } from "../src/utils";

const connection = new Connection("http://localhost:8899", "confirmed");

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
  async function derivePda(token: string, pubKey: anchor.web3.PublicKey){
    let [pda, _] = await anchor.web3.PublicKey.findProgramAddress(
      [
        pubKey.toBuffer(),
        Buffer.from("_"),
        Buffer.from(token)
      ],
      program.programId
    );
    return pda;
  }

  //criar contabil
  async function createLedgerAccount(
    token: string,
    pda: anchor.web3.PublicKey,
    wallet: anchor.web3.Keypair){

        await program.methods.createLedger(token)
        .accounts({
          ledgerAccount: pda,
          wallet: wallet.publicKey,
        })
        .signers([wallet])
        .rpc()
  }

  async function modifyLedger(
    token: string,
    newBalance: number,
    wallet: anchor.web3.Keypair
  ){
    console.log("--------------------------------------------------")
    let data;
    let pda = await derivePda(token, wallet.publicKey);

    console.log(`Checking if account ${shortKey(pda)} exists for token: ${token}...`)
    try {
      data = await program.account.ledger.fetch(pda);
      console.log("Its does.")
    } catch (error) {
      console.log("It does Not. Creating...");
      await createLedgerAccount(token, pda, wallet);
      data = await program.account.ledger.fetch(pda);
    };

    console.log("Success.");
    console.log("Data." + JSON.stringify(data));
    console.log(`Token: ${data.token}   Balance: ${data.balance}`);
    console.log(`Modifying balance of ${data.token} from  ${data.balance} + ${newBalance}`);


    await program.methods.modifyLedger(data.balance + newBalance).accounts({
      ledgerAccount: pda,
      wallet: wallet.publicKey,
    })
    .signers([wallet])
    .rpc();

    data = await program.account.ledger.fetch(pda);
    console.log("New Data.");
    console.log(`Token: ${data.token}   Balance: ${data.balance}`);
    console.log("Success.");
  }


   // Generate a random keypair that will represent our token
   const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();
   // AssociatedTokenAccount for anchor's workspace wallet
   let associatedTokenAccount = undefined;

   it("Mint a token", async () => {
    // Get anchor's wallet's public key
    const key = anchor.AnchorProvider.env().wallet.publicKey;//owner
    // Get the amount of SOL needed to pay rent for our Token Mint
    const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(
      MINT_SIZE
    );

    // Get the ATA for a token and the account that we want to own the ATA (but it might not existing on the SOL network yet)
    associatedTokenAccount = await getAssociatedTokenAddress(
      mintKey.publicKey,
      key
    );

    // Fires a list of instructions
    const mint_tx = new anchor.web3.Transaction().add(
      // Use anchor to create an account from the mint key that we created
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: key,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        programId: TOKEN_PROGRAM_ID,
        lamports,
      }),
      // Fire a transaction to create our mint account that is controlled by our anchor wallet
      createInitializeMintInstruction(
        mintKey.publicKey, 0, key, key
      ),
      // Create the ATA account that is associated with our mint on our anchor wallet
      createAssociatedTokenAccountInstruction(
        key, associatedTokenAccount, key, mintKey.publicKey
      )
    );

    // sends and create the transaction
    const res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, [mintKey]);

    console.log(
      await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
    );

    console.log("Account: ", res);
    console.log("Mint key: ", mintKey.publicKey.toString());
    console.log("User: ", key.toString());

    // Executes our code to mint our token into our specified ATA
    const tx = await program.methods.mintToken().accounts({
      mint: mintKey.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: associatedTokenAccount,
      payer: key,
    }).rpc();

    console.log("Your transaction signature", tx);
    // Get minted token amount on the ATA for our anchor wallet
    const minted = (await program.provider.connection.getParsedAccountInfo(associatedTokenAccount)).value.data.parsed.info.tokenAmount.amount;
    assert.equal(minted, 10);
  });

  it("Transfer token", async () => {
    // Get anchor's wallet's public key
    const myWallet = anchor.AnchorProvider.env().wallet.publicKey;
    // Wallet that will receive the token 
    const toWallet: anchor.web3.Keypair = anchor.web3.Keypair.generate();
    // The ATA for a token on the to wallet (but might not exist yet)
    const toATA = await getAssociatedTokenAddress(
      mintKey.publicKey,
      toWallet.publicKey
    );

    // Fires a list of instructions
    const mint_tx = new anchor.web3.Transaction().add(
      // Create the ATA account that is associated with our To wallet
      createAssociatedTokenAccountInstruction(
        myWallet, toATA, toWallet.publicKey, mintKey.publicKey
      )
    );

    // Sends and create the transaction
    const res = await anchor.AnchorProvider.env().sendAndConfirm(mint_tx, []);
    console.log(res);

    // Executes our transfer smart contract 
    const tx = await program.methods.transferToken().accounts({
      tokenProgram: TOKEN_PROGRAM_ID,
      from: associatedTokenAccount,
      signer: myWallet,
      to: toATA,
    }).rpc();

    console.log("Your Transation signature ", tx)
    // Get minted token amount on the ATA for our anchor wallet
    const minted = (await program.provider.connection.getParsedAccountInfo(associatedTokenAccount)).value.data.parsed.info.tokenAmount.amount;
    assert.equal(minted, 5);
  });


  it("Is initialized!", async () => {
   /*//get keypair keys
    //keypair CattleProgram
    let exist = getFile("cattleProgram-keypair");
    if(!exist){generateKeypairLocal("cattleProgram-keypair")}
    const CattleProgramKeypair = getKeypair("cattleProgram-keypair");

    await modifyLedger("cattle",  1, CattleProgramKeypair);
    await modifyLedger("brz",  1, CattleProgramKeypair);
    console.log("");*/

    const tokenAccounts = await connection.getTokenAccountsByOwner(
      new PublicKey(anchor.AnchorProvider.env().wallet.publicKey),
      {
        programId: TOKEN_PROGRAM_ID,
      }
    );
  
    console.log("Token                                         Balance");
    console.log("------------------------------------------------------------");
    tokenAccounts.value.forEach((tokenAccount) => {
      const accountData = AccountLayout.decode(tokenAccount.account.data);
      console.log(`${new PublicKey(accountData.mint)}   ${accountData.amount}`);
    })


 /*   const accounts = await connection.getProgramAccounts(
      program.programId,
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 32, // number of bytes
              bytes: CattleProgramKeypair.publicKey.toString(), // base58 encoded string
            },
          },
        ],
      }
    );
  
    console.log(
      `Found ${accounts.length} token account(s) for wallet ${CattleProgramKeypair.publicKey}: `
    );
    accounts.forEach((account, i) => {
      console.log(
        `-- Token Account Address ${i + 1}: ${account.pubkey.toString()} --`
      );
      console.log(`Mint: ${account.account.data["parsed"]["info"]["mint"]}`);
      console.log(
        `Amount: ${account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"]}`
      );
    });*/

  });
});
