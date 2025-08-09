from tonutils.client import TonapiClient
from tonutils.utils import to_amount
from tonutils.wallet import WalletV4R2
import logging

logger = logging.getLogger('wallet.api')


async def send_transfer(
    API_KEY: str,
    MNEMONIC: list,
    address: str,
    amount: int,
    payload: str
    ) -> str:
    """
    Send TON transfer using wallet
    """
    try:
        logger.debug('send_transfer address=%s amount=%s', address, amount)
        client = TonapiClient(api_key=API_KEY, is_testnet=False)
        wallet, public_key, private_key, mnemonic = WalletV4R2.from_mnemonic(client, MNEMONIC)
        
        tx_hash = await wallet.transfer(
            destination=address,
            amount=to_amount(amount, 9, 9),
            body=payload,
        )

        logger.debug('send_transfer success tx_hash=%s', tx_hash)
        return tx_hash
    except Exception as e:
        logger.exception('send_transfer error: %s', e)
        raise


async def get_balance(
    API_KEY: str,
    MNEMONIC: list
    ) -> int:
    """
    Get wallet balance
    """
    try:
        logger.debug('get_balance')
        client = TonapiClient(api_key=API_KEY, is_testnet=False)
        wallet, public_key, private_key, mnemonic = WalletV4R2.from_mnemonic(client, MNEMONIC)
        
        balance = await wallet.balance()
        logger.debug('get_balance result=%s', balance)
        return balance
    except Exception as e:
        logger.exception('get_balance error: %s', e)
        raise
