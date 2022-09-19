use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, InitializeMint, MintTo, Transfer};

//verificar program id apos o build
declare_id!("9MagLzLnGVDD1zFfiqkJQzCoAiqc5kbt2bTU4NmW3P9C");

#[program]
pub mod pdas {
    use super::*;

    pub fn create_ledger(
        ctx: Context<CreateLedger>,
        token: String
    ) -> Result<()> {
        //get account
        let ledger_account = &mut ctx.accounts.ledger_account;
        //get token
        ledger_account.token = token;
        //balance
        ledger_account.balance  = 0;
        Ok(())
    }

    pub fn modify_ledger(
        ctx: Context<ModifyLedger>,
        new_balance: u32
    ) -> Result<()> {

        let ledger_account = &mut ctx.accounts.ledger_account;
        ledger_account.balance  = new_balance;
        Ok(())
    }

    pub fn mint_token(ctx: Context<MintToken>) -> Result<()>{
        //create the mintTo struct for our context
        let cpi_accounts = MintTo{
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(), //payer fee autoridade da conta
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        //create the CpiContext we need for the request
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::mint_to(cpi_ctx, 10)?; //interrogação == obter dados
        Ok(())
    }

    pub fn transfer_token(ctx: Context<TransferToken>) -> Result<()>{
        //create the Transfer struct for our context
        let transfer_instruction = Transfer{
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(), //payer fee autoridade da conta
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, transfer_instruction);

        //execute anchor's helper function tgo transfer tokens
        anchor_spl::token::transfer(cpi_ctx, 5)?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(token: String)]
pub struct CreateLedger <'info>{
    #[account(
        init, //iniciar o pda
        payer = wallet,
        space = 82,
        seeds = [
            wallet.key().as_ref(),
            b"_",
            token.as_ref(),
        ],
        bump

    )]
    pub ledger_account: Account<'info, Ledger>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>
}


#[derive(Accounts)]
pub struct ModifyLedger <'info>{
    #[account(mut)]
    pub ledger_account: Account<'info, Ledger>,
    #[account(mut)]
    pub wallet: Signer<'info>,
}

#[account]
pub struct Ledger {
    pub token: String, //token
    pub balance: u32,
    pub total_breeder_open_contract: u32,
    pub total_breeder_confirmed_contract: u32,
    pub total_breeder_closed_contract: u32,
    pub arroba_quotation: u32
}

/*
totalBreederOpenContract
totalBreederConfirmedContract
totalBreederClosedContract
arrobaQuotation
cattleQuotation
totalInvestidorOpenContract
totalInvestorOpenContract
totalInvestorConfirmedContract
totalInvestorClosedContract
*/

#[derive(Accounts)]
pub struct MintToken<'info>{
    /// CHECK:  this is not dangerous because we dont't read or write from this account
    #[account(mut)]
    pub mint: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    /// CHECK:  this is not dangerous because we dont't read or write from this account
    #[account(mut)]
    pub token_account: UncheckedAccount<'info>,
    /// CHECK:  this is not dangerous because we dont't read or write from this account
    #[account(mut)]
    pub payer:  AccountInfo<'info>,
}


#[derive(Accounts)]
pub struct TransferToken<'info> {
    pub token_program: Program<'info, Token>,
    /// CHECK:  this is not dangerous because we dont't read or write from this account
    #[account(mut)]
    pub from: UncheckedAccount<'info>,
    /// CHECK:  this is not dangerous because we dont't read or write from this account
    #[account(mut)]
    pub to: AccountInfo<'info>,
    #[account(mut)]
    pub signer:  Signer<'info>,
}