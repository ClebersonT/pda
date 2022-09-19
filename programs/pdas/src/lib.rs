use anchor_lang::prelude::*;

//verificar program id apos o build
declare_id!("BY9GoVi8LaPHyFpVoo6UNBa34DvxE8mtVe7e4nF2C9rZ");

#[program]
pub mod pdas {
    use super::*;
    
    pub fn create_treasure(
        ctx: Context<CreateTreasure>,
        treasure: String,
        total_breeder_open_contract: u32,
        total_breeder_confirmed_contract: u32,
        total_breeder_closed_contract: u32,
        arroba_quotation: u32,
        cattle_quotation: u32,
        total_investor_open_contract: u32,
        total_investor_confirmed_contract: u32,
        total_investor_closed_contract: u32,
    ) -> Result<()> {

        let treasure_account = &mut ctx.accounts.treasure_account;
        treasure_account.treasure = treasure;
        treasure_account.total_breeder_open_contract = 0;
        treasure_account.total_breeder_confirmed_contract = 0;
        treasure_account.total_breeder_closed_contract = 0;
        treasure_account.arroba_quotation = 0;
        treasure_account.cattle_quotation = 0;
        treasure_account.total_investor_open_contract = 0;
        treasure_account.total_investor_confirmed_contract = 0;
        treasure_account.total_investor_closed_contract = 0;
        Ok(())
    }

    pub fn modify_treasure(
        ctx: Context<ModifyTreasure>,
        new_total_breeder_open_contract: u32,
        new_total_breeder_confirmed_contract: u32,
        new_total_breeder_closed_contract: u32,
        new_arroba_quotation: u32,
        new_cattle_quotation: u32,
        new_total_investor_open_contract: u32,
        new_total_investor_confirmed_contract: u32,
        new_total_investor_closed_contract: u32
    ) -> Result<()> {

        let treasure_account = &mut ctx.accounts.treasure_account;
        treasure_account.total_breeder_open_contract = new_total_breeder_open_contract;
        treasure_account.total_breeder_confirmed_contract = new_total_breeder_confirmed_contract;
        treasure_account.total_breeder_closed_contract = new_total_breeder_closed_contract;
        treasure_account.arroba_quotation = new_arroba_quotation;
        treasure_account.cattle_quotation = new_cattle_quotation;
        treasure_account.total_investor_open_contract = new_total_investor_open_contract;
        treasure_account.total_investor_confirmed_contract = new_total_investor_confirmed_contract;
        treasure_account.total_investor_closed_contract = new_total_investor_closed_contract;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(treasure: String)]
pub struct CreateTreasure <'info>{
    #[account(
        init, //iniciar o pda
        payer = wallet,
        space = 82,
        seeds = [
            wallet.key().as_ref(),
            b"_",
            treasure.as_ref(),
        ],
        bump
    )]
    pub treasure_account: Account<'info, Database>,
    #[account(mut)]
    pub wallet: Signer<'info>,
    pub system_program: Program<'info, System>
}


#[derive(Accounts)]
pub struct ModifyTreasure <'info>{
    #[account(mut)]
    pub treasure_account: Account<'info, Database>,
    #[account(mut)]
    pub wallet: Signer<'info>,
}

#[account]
pub struct Database {
    pub treasure: String,
    pub total_breeder_open_contract: u32,
    pub total_breeder_confirmed_contract: u32,
    pub total_breeder_closed_contract: u32,
    pub arroba_quotation: u32,
    pub cattle_quotation: u32,
    pub total_investor_open_contract: u32,
    pub total_investor_confirmed_contract: u32,
    pub total_investor_closed_contract: u32,
}