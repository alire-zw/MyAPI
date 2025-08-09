import requests
import base64
import logging
import time
import json

logger = logging.getLogger('fragment.api')


async def encoded(encoded_string: str) -> str:
    """
    Decode base64 encoded string for Fragment API
    """
    missing_padding = len(encoded_string) % 4
    if missing_padding != 0:
        encoded_string += '=' * (4 - missing_padding)
    
    try:
        decoded_bytes = base64.b64decode(encoded_string)
        decoded_string = decoded_bytes.decode("utf-8", errors="ignore") 
        
        for i, char in enumerate(decoded_string):
            if char.isdigit():
                cleaned_string = decoded_string[i:]
                break
        else:
            cleaned_string = decoded_string
        return cleaned_string
    except Exception:
        return encoded_string


def post(
    COOKIES: str,
    HASH: str,
    data: dict,
    referer: str
    ) -> requests.Response:
    """
    Make POST request to Fragment API
    """
    params = {
        'hash': HASH
    }

    headers = {
        'accept': 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'en-US,en;q=0.5',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://fragment.com',
        'priority': 'u=1, i',
        'referer': referer,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'cookie': COOKIES,
        'x-requested-with': 'XMLHttpRequest',
    }
    
    t0 = time.time()
    try:
        logger.debug('POST https://fragment.com/api | params=%s referer=%s', params, referer)
        logger.debug('Headers UA=%s | Cookie set=%s cf_clearance=%s', headers['user-agent'], bool(COOKIES), ('cf_clearance' in COOKIES))
        logger.debug('Data=%s', data)
        resp = requests.post('https://fragment.com/api', params=params, headers=headers, data=data)
        dt = (time.time() - t0) * 1000
        logger.debug('Response status=%s time_ms=%.1f', resp.status_code, dt)
        logger.debug('Resp headers: content-type=%s cf-ray=%s', resp.headers.get('content-type'), resp.headers.get('cf-ray'))
        try:
            logger.debug('Resp json: %s', resp.json())
        except Exception:
            logger.debug('Resp text: %s', resp.text[:500])
        return resp
    except Exception as ex:
        logger.exception('POST failed: %s', ex)
        raise


async def get_user_address(
    COOKIES: str,
    HASH: str,
    username: str,
    quantity: int
    ) -> dict:
    """
    Search for user address by username
    """
    logger.debug('get_user_address username=%s quantity=%s', username, quantity)
    data = {
        'query': username,
        'quantity': str(quantity),
        'method': 'searchStarsRecipient',
    }
    referer = f'https://fragment.com/stars/buy?quantity={quantity}'
    response = post(COOKIES, HASH, data, referer)
    return response.json()


async def init_buy_stars(
    COOKIES: str,
    HASH: str,
    recipient: str,
    quantity: int
    ) -> dict:
    """
    Initialize buy stars request
    """
    logger.debug('init_buy_stars recipient=%s quantity=%s', recipient, quantity)
    data = {
        'recipient': recipient,
        'quantity': str(quantity),
        'method': 'initBuyStarsRequest',
    }
    referer = f'https://fragment.com/stars/buy?recipient={recipient}&quantity={quantity}'
    response = post(COOKIES, HASH, data, referer)
    return response.json()


async def get_buy_stars(
    COOKIES: str,
    HASH: str,
    req_id: str,
    recipient: str,
    quantity: int,
    account_json: str,
    device_json: str,
    show_sender: int = 1,
    ) -> dict:
    """
    Get buy stars link
    """
    logger.debug('get_buy_stars req_id=%s recipient=%s quantity=%s show_sender=%s', req_id, recipient, quantity, show_sender)
    data = {
        'transaction': '1',
        'id': str(req_id),
        'show_sender': str(show_sender),
        'account': account_json,
        'device': device_json,
        'method': 'getBuyStarsLink',
    }
    referer = f'https://fragment.com/stars/buy?recipient={recipient}&quantity={quantity}'
    response = post(COOKIES, HASH, data, referer)
    return response.json()


async def update_stars_buy_state(
    COOKIES: str,
    HASH: str,
    mode: str,
    lv: bool,
    referer: str,
    dh: str | None = None,
    ) -> dict:
    """
    Update stars buy state
    """
    logger.debug('update_stars_buy_state mode=%s lv=%s dh_len=%s', mode, lv, (len(dh) if dh else 0))
    data = {
        'mode': mode,
        'lv': '1' if lv else '0',
        'method': 'updateStarsBuyState',
    }
    if dh:
        data['dh'] = dh
    response = post(COOKIES, HASH, data, referer)
    return response.json()


def build_cookies_from_data(data: dict) -> str:
    """
    Build cookie string from data dictionary
    """
    if not data:
        return ''
    parts = [
        f"stel_ssid={data.get('stel_ssid', '')}",
        f"stel_dt={data.get('stel_dt', '')}",
        f"stel_ton_token={data.get('stel_ton_token', '')}",
        f"stel_token={data.get('stel_token', '')}",
    ]
    if data.get('cf_clearance'):
        parts.append(f"cf_clearance={data.get('cf_clearance')}")
    return '; '.join(parts)


def build_account_json(fragment_data: dict) -> str:
    """
    Build account JSON string for Fragment API
    """
    account_json = {
        'address': fragment_data.get('fragmentAddress', ''),
        'chain': '-239',  # -239 mainnet
        'walletStateInit': fragment_data.get('fragmentWallets', ''),
        'publicKey': fragment_data.get('fragmentPublicKey', '')
    }
    return json.dumps(account_json, separators=(',', ':'))


def build_device_json() -> str:
    """
    Build device JSON string for Fragment API
    """
    device_json = {
        'platform': 'windows',
        'appName': 'tonkeeper',
        'appVersion': '4.1.2',
        'maxProtocolVersion': 2,
        'features': [
            'SendTransaction',
            {'name': 'SendTransaction', 'maxMessages': 4, 'extraCurrencySupported': True},
            {'name': 'SignData', 'types': ['text', 'binary', 'cell']},
        ],
    }
    return json.dumps(device_json, separators=(',', ':'))
