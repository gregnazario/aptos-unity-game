module space_fighters::payments {
    use std::error;
    use std::signer;

    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_std::smart_table::{Self, SmartTable};

    /// The account is not authorized to update the resources.
    const ENOT_AUTHORIZED: u64 = 1;
    /// Not enough balance
    const ENOT_ENOUGH_BALANCE: u64 = 2;

    struct PaymentConfig has key {
        balances: SmartTable<address, Coin<AptosCoin>>,
    }

    fun init_module(
        admin: &signer,
    ) {
        move_to(admin, PaymentConfig {
            balances: smart_table::new(),
        })
    }

    entry fun deposit(
        user: &signer,
        amount: u64,
    ) acquires PaymentConfig {
        let user_addr = signer::address_of(user);
        let coins = coin::withdraw<AptosCoin>(user, amount);
        let balances_table = &mut borrow_global_mut<PaymentConfig>(@space_fighters).balances;
        if (!smart_table::contains(balances_table, user_addr)) {
            smart_table::add(balances_table, user_addr, coins);
        } else {
            let user_coins = smart_table::borrow_mut(balances_table, user_addr);
            coin::merge(user_coins, coins);
        };
    }

    entry fun withdraw(
        user: &signer,
        amount: u64,
    ) acquires PaymentConfig {
        let user_addr = signer::address_of(user);
        let balances_table = &mut borrow_global_mut<PaymentConfig>(@space_fighters).balances;
        if (!smart_table::contains(balances_table, user_addr)) {
            assert!(false, error::not_found(ENOT_ENOUGH_BALANCE));
        } else {
            let user_coins = smart_table::borrow_mut(balances_table, user_addr);
            let coins = coin::extract(user_coins, amount);
            coin::deposit<AptosCoin>(user_addr, coins);
        };
    }

    entry fun admin_withdraw(
        admin: &signer,
        from: address,
        amount: u64,
    ) acquires PaymentConfig {
        assert!(signer::address_of(admin) == @space_fighters, error::permission_denied(ENOT_AUTHORIZED));        
        let balances_table = &mut borrow_global_mut<PaymentConfig>(@space_fighters).balances;
        if (!smart_table::contains(balances_table, from)) {
            assert!(false, error::not_found(ENOT_ENOUGH_BALANCE));
        } else {
            let from_coins = smart_table::borrow_mut(balances_table, from);
            let coins = coin::extract(from_coins, amount);
            coin::deposit<AptosCoin>(signer::address_of(admin), coins);
        };
    }

    #[view]
    public fun view_user_balance(
        user: address,
    ): u64 acquires PaymentConfig {
        let balances_table = &borrow_global<PaymentConfig>(@space_fighters).balances;
        if (!smart_table::contains(balances_table, user)) {
            0
        } else {
            let user_coins = smart_table::borrow(balances_table, user);
            coin::value(user_coins)
        }
    }
}
