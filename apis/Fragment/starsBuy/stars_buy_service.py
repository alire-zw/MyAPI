import requests
import json
import logging
import asyncio
from typing import Optional, Dict, Any
from api import fragment, wallet

logger = logging.getLogger('stars_buy_service')


class StarsBuyService:
    def __init__(self, api_base_url: str = "http://localhost:3000/api"):
        self.api_base_url = api_base_url
        
    async def get_user_data_from_api(self, user_id: int) -> Dict[str, Any]:
        """
        Get user wallet and fragment data from Node.js API
        """
        try:
            # Get wallet data
            wallet_response = requests.get(f"{self.api_base_url}/wallets/user/{user_id}")
            if wallet_response.status_code != 200:
                raise Exception(f"Failed to get wallet data: {wallet_response.text}")
            
            wallet_data = wallet_response.json()
            if not wallet_data.get("success") or not wallet_data.get("data"):
                raise Exception("No wallet found for user")
            
            # Get first wallet (users should have one wallet per subscription)
            user_wallet = wallet_data["data"][0] if wallet_data["data"] else None
            if not user_wallet:
                raise Exception("No wallet found for user")
            
            # Get fragment data
            fragment_response = requests.get(f"{self.api_base_url}/fragment-user-data/user/{user_id}/active")
            if fragment_response.status_code != 200:
                raise Exception(f"Failed to get fragment data: {fragment_response.text}")
            
            fragment_data = fragment_response.json()
            if not fragment_data.get("success") or not fragment_data.get("data"):
                raise Exception("No active fragment data found for user")
            
            user_fragment = fragment_data["data"]
            
            return {
                "wallet": user_wallet,
                "fragment": user_fragment
            }
            
        except Exception as e:
            logger.exception(f"Error getting user data: {e}")
            raise
    
    def build_cookies_from_fragment_data(self, fragment_data: Dict[str, Any]) -> str:
        """
        Build cookies string from fragment data
        """
        cookies_data = {
            'stel_ssid': fragment_data.get('stelSsid', ''),
            'stel_dt': fragment_data.get('stelDt', ''),
            'stel_ton_token': fragment_data.get('stelTonToken', ''),
            'stel_token': fragment_data.get('stelToken', ''),
            'cf_clearance': fragment_data.get('cfClearance', '')
        }
        return fragment.build_cookies_from_data(cookies_data)
    
    async def search_user(self, user_id: int, username: str, quantity: int = 50) -> Optional[Dict[str, Any]]:
        """
        Search for a Telegram user by username
        """
        try:
            logger.debug('search_user user_id=%s username=%s quantity=%s', user_id, username, quantity)
            
            # Get user data from API
            user_data = await self.get_user_data_from_api(user_id)
            fragment_data = user_data["fragment"]
            
            # Build cookies and hash
            cookies = self.build_cookies_from_fragment_data(fragment_data)
            hash_value = fragment_data.get('fragmentHash', '')
            
            # Search for user
            user_result = await fragment.get_user_address(cookies, hash_value, username, quantity)
            found = user_result.get("found") or {}
            
            nickname = found.get("name")
            address = found.get("recipient") or found.get("address")
            
            if not nickname or not address:
                logger.debug('search_user no nickname/address | user_result=%s', user_result)
                return None
            
            result = {
                "nickname": nickname,
                "address": address,
                "quantity": quantity
            }
            
            logger.debug('search_user result=%s', result)
            return result
            
        except Exception as e:
            logger.exception(f"Error searching user: {e}")
            return None
    
    async def buy_stars(self, user_id: int, username: str, quantity: int) -> Optional[str]:
        """
        Buy stars for a user
        """
        try:
            logger.debug('buy_stars user_id=%s username=%s quantity=%s', user_id, username, quantity)
            
            # Get user data from API
            user_data = await self.get_user_data_from_api(user_id)
            wallet_data = user_data["wallet"]
            fragment_data = user_data["fragment"]
            
            # Build cookies and hash
            cookies = self.build_cookies_from_fragment_data(fragment_data)
            hash_value = fragment_data.get('fragmentHash', '')
            
            # Search for recipient
            user_result = await fragment.get_user_address(cookies, hash_value, username, quantity)
            found = user_result.get("found") or {}
            
            nickname = found.get("name")
            address = found.get("recipient")
            
            if not nickname or not address:
                logger.error('buy_stars: no nickname/address in user_result=%s', user_result)
                return None
            
            # Step 1: Update stars buy state
            referer = f'https://fragment.com/stars/buy?recipient={address}&quantity={quantity}'
            try:
                update_result = await fragment.update_stars_buy_state(
                    COOKIES=cookies,
                    HASH=hash_value,
                    mode="new",
                    lv=True,
                    referer=referer,
                    dh=None,
                )
                logger.debug('updateStarsBuyState result: %s', update_result)
            except Exception as ex:
                logger.warning('updateStarsBuyState failed: %s', ex)
            
            # Step 2: Initialize buy stars request
            init_result = await fragment.init_buy_stars(cookies, hash_value, address, quantity)
            req_id = init_result.get('req_id')
            
            if not req_id:
                logger.error('No req_id in init response: %s', init_result)
                return None
            
            # Step 3: Get buy stars transaction
            account_json = fragment.build_account_json(fragment_data)
            device_json = fragment.build_device_json()
            
            buy_result = await fragment.get_buy_stars(
                cookies, hash_value, req_id, address, quantity,
                account_json=account_json,
                device_json=device_json,
                show_sender=1,
            )
            
            if buy_result.get('error'):
                logger.error('getBuyStarsLink error: %s', buy_result)
                return None
            
            # Extract transaction details
            transaction = buy_result.get('transaction', {})
            messages = transaction.get('messages', [])
            if not messages:
                logger.error('No messages in transaction: %s', buy_result)
                return None
            
            message = messages[0]
            dest_address = message.get('address')
            amount_str = message.get('amount')
            amount = int(amount_str) if isinstance(amount_str, str) else amount_str
            payload = message.get('payload')
            
            if not dest_address or not amount or not payload:
                logger.error('Missing transaction data: address=%s amount=%s payload=%s', dest_address, amount, payload)
                return None
            
            # Decode payload
            payload = await fragment.encoded(payload)
            
            # Step 4: Send TON transfer
            mnemonic_list = wallet_data.get('mnemonics', '').split()
            ton_api_key = wallet_data.get('tonApiKey', '')
            
            if not mnemonic_list or not ton_api_key:
                logger.error('Missing wallet data: mnemonic=%s tonApiKey=%s', bool(mnemonic_list), bool(ton_api_key))
                return None
            
            tx_hash = await wallet.send_transfer(ton_api_key, mnemonic_list, dest_address, amount, payload)
            
            if tx_hash:
                logger.debug('buy_stars success tx_hash=%s', tx_hash)
                return tx_hash
            else:
                logger.error('buy_stars: no tx_hash returned')
                return None
                
        except Exception as e:
            logger.exception(f"Error buying stars: {e}")
            return None
    
    async def get_wallet_balance(self, user_id: int) -> Optional[int]:
        """
        Get wallet balance for a user
        """
        try:
            logger.debug('get_wallet_balance user_id=%s', user_id)
            
            # Get user data from API
            user_data = await self.get_user_data_from_api(user_id)
            wallet_data = user_data["wallet"]
            
            mnemonic_list = wallet_data.get('mnemonics', '').split()
            ton_api_key = wallet_data.get('tonApiKey', '')
            
            if not mnemonic_list or not ton_api_key:
                logger.error('Missing wallet data: mnemonic=%s tonApiKey=%s', bool(mnemonic_list), bool(ton_api_key))
                return None
            
            balance = await wallet.get_balance(ton_api_key, mnemonic_list)
            logger.debug('get_wallet_balance result=%s', balance)
            return balance
            
        except Exception as e:
            logger.exception(f"Error getting wallet balance: {e}")
            return None
