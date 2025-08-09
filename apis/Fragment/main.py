from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
import sys
import json
from datetime import datetime

# Add the wallet creation module to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'walletCreate'))
# Add the stars buy module to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'starsBuy'))

from walletCreate.wallet_generator import WalletGenerator
from starsBuy.stars_buy_service import StarsBuyService

app = Flask(__name__)
CORS(app)

# Configuration
API_BASE_URL = "http://localhost:3000/api"
API_KEY_HEADER = "X-API-Key"

class WalletAPI:
    def __init__(self):
        self.wallet_generator = WalletGenerator()
        self.stars_buy_service = StarsBuyService()
    
    def validate_api_key(self, api_key):
        """Validate API key with the main API server"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/subscriptions/validate",
                json={"apiKey": api_key},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("success", False) and data.get("data", {}).get("isValid", False)
            return False
        except Exception as e:
            print(f"Error validating API key: {e}")
            return False
    
    def get_subscription_info(self, api_key):
        """Get subscription information from the main API server"""
        try:
            response = requests.post(
                f"{API_BASE_URL}/subscriptions/validate",
                json={"apiKey": api_key},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success", False):
                    return data.get("data", {}).get("subscription", {})
            return None
        except Exception as e:
            print(f"Error getting subscription info: {e}")
            return None

wallet_api = WalletAPI()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "success": True,
        "message": "Fragment Wallet API is running",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route('/generate-wallet', methods=['POST'])
def generate_wallet():
    """Generate a single wallet"""
    try:
        # Get API key from header
        api_key = request.headers.get(API_KEY_HEADER)
        if not api_key:
            return jsonify({
                "success": False,
                "message": "API key is required"
            }), 401
        
        # Validate API key
        if not wallet_api.validate_api_key(api_key):
            return jsonify({
                "success": False,
                "message": "Invalid API key"
            }), 401
        
        # Get subscription info
        subscription = wallet_api.get_subscription_info(api_key)
        if not subscription:
            return jsonify({
                "success": False,
                "message": "Could not retrieve subscription information"
            }), 400
        
        # Check if subscription is for Fragment API
        if subscription.get("selectedAPI") != "Fragment":
            return jsonify({
                "success": False,
                "message": "This API key is not authorized for Fragment API"
            }), 403
        
        # Check if subscription already has a wallet
        subscription_id = subscription.get("id")
        if not subscription_id:
            return jsonify({
                "success": False,
                "message": "Could not retrieve subscription ID"
            }), 400
        
        # Check if wallet already exists for this subscription
        check_response = requests.get(
            f"{API_BASE_URL}/wallets/subscription/{subscription_id}",
            headers={"Content-Type": "application/json"}
        )
        
        if check_response.status_code == 200:
            existing_wallets = check_response.json().get("data", [])
            if existing_wallets:
                return jsonify({
                    "success": False,
                    "message": "This subscription already has a wallet. Only one wallet per subscription is allowed."
                }), 400
        
        # Generate wallet
        wallet_data = wallet_api.wallet_generator.generate_single_wallet()
        
        print(f"Generated wallet data: {wallet_data}")
        
        # Save wallet to database
        selected_user = subscription.get("selectedUser")
        if not selected_user:
            return jsonify({
                "success": False,
                "message": "Could not retrieve user ID from subscription"
            }), 400
            
        wallet_save_data = {
            "subscriptionId": int(subscription_id),
            "userId": int(selected_user),
            "walletAddress": str(wallet_data["address"]),
            "mnemonics": " ".join(wallet_data["mnemonics"]),
            "publicKey": str(wallet_data["public_key"]),
            "privateKey": str(wallet_data["private_key"]),
            "workchain": int(wallet_data["workchain"]),
            "version": str(wallet_data["version"])
        }
        
        print(f"Saving wallet data: {wallet_save_data}")
        
        save_response = requests.post(
            f"{API_BASE_URL}/wallets",
            json=wallet_save_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Save response status: {save_response.status_code}")
        print(f"Save response content: {save_response.text}")
        
        if save_response.status_code != 201:
            error_data = save_response.json() if save_response.content else {}
            return jsonify({
                "success": False,
                "message": f"Error saving wallet to database: {error_data.get('message', 'Unknown error')}",
                "status_code": save_response.status_code,
                "response": error_data
            }), 500
        
        saved_wallet = save_response.json().get("data", {})
        
        return jsonify({
            "success": True,
            "message": "Wallet generated and saved successfully",
            "data": {
                "wallet": wallet_data,
                "saved_wallet": saved_wallet,
                "subscription": {
                    "userName": subscription.get("userName"),
                    "selectedAPI": subscription.get("selectedAPI"),
                    "selectedSubscribe": subscription.get("selectedSubscribe")
                },
                "generated_at": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error generating wallet: {str(e)}"
        }), 500



@app.route('/wallet-info', methods=['GET'])
def get_wallet_info():
    """Get information about wallet generation capabilities"""
    try:
        # Get API key from header
        api_key = request.headers.get(API_KEY_HEADER)
        if not api_key:
            return jsonify({
                "success": False,
                "message": "API key is required"
            }), 401
        
        # Validate API key
        if not wallet_api.validate_api_key(api_key):
            return jsonify({
                "success": False,
                "message": "Invalid API key"
            }), 401
        
        # Get subscription info
        subscription = wallet_api.get_subscription_info(api_key)
        if not subscription:
            return jsonify({
                "success": False,
                "message": "Could not retrieve subscription information"
            }), 400
        
        # Check if subscription is for Fragment API
        if subscription.get("selectedAPI") != "Fragment":
            return jsonify({
                "success": False,
                "message": "This API key is not authorized for Fragment API"
            }), 403
        
        # Check if subscription already has a wallet
        subscription_id = subscription.get("id")
        has_wallet = False
        if subscription_id:
            check_response = requests.get(
                f"{API_BASE_URL}/wallets/subscription/{subscription_id}",
                headers={"Content-Type": "application/json"}
            )
            if check_response.status_code == 200:
                existing_wallets = check_response.json().get("data", [])
                has_wallet = len(existing_wallets) > 0
        
        return jsonify({
            "success": True,
            "data": {
                "subscription": {
                    "userName": subscription.get("userName"),
                    "selectedAPI": subscription.get("selectedAPI"),
                    "selectedSubscribe": subscription.get("selectedSubscribe"),
                    "hasWallet": has_wallet
                },
                "api_info": {
                    "name": "Fragment Wallet Generator",
                    "version": "1.0.0",
                    "description": "Generate TON wallets with mnemonic phrases (one wallet per subscription)",
                    "endpoints": {
                        "generate_wallet": "POST /generate-wallet",
                        "info": "GET /wallet-info"
                    },
                    "rules": {
                        "maxWalletsPerSubscription": 1,
                        "walletFormat": "v4r2",
                        "workchain": 0
                    }
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error getting wallet info: {str(e)}"
        }), 500

@app.route('/search-user', methods=['POST'])
def search_user():
    """Search for a Telegram user by username"""
    try:
        # Get API key from header
        api_key = request.headers.get(API_KEY_HEADER)
        if not api_key:
            return jsonify({
                "success": False,
                "message": "API key is required"
            }), 401
        
        # Validate API key
        if not wallet_api.validate_api_key(api_key):
            return jsonify({
                "success": False,
                "message": "Invalid API key"
            }), 401
        
        # Get subscription info
        subscription = wallet_api.get_subscription_info(api_key)
        if not subscription:
            return jsonify({
                "success": False,
                "message": "Could not retrieve subscription information"
            }), 400
        
        # Check if subscription is for Fragment API
        if subscription.get("selectedAPI") != "Fragment":
            return jsonify({
                "success": False,
                "message": "This API key is not authorized for Fragment API"
            }), 403
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400
        
        username = data.get("username")
        quantity = data.get("quantity", 50)
        
        if not username:
            return jsonify({
                "success": False,
                "message": "Username is required"
            }), 400
        
        # Remove @ if present
        username = username.lstrip("@")
        
        # Search for user
        import asyncio
        user_result = asyncio.run(wallet_api.stars_buy_service.search_user(
            user_id=subscription.get("selectedUser"),
            username=username,
            quantity=quantity
        ))
        
        if not user_result:
            return jsonify({
                "success": False,
                "message": "User not found or no recipient address available"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "User found successfully",
            "data": user_result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error searching user: {str(e)}"
        }), 500


@app.route('/buy-stars', methods=['POST'])
def buy_stars():
    """Buy Telegram Stars for a user"""
    try:
        # Get API key from header
        api_key = request.headers.get(API_KEY_HEADER)
        if not api_key:
            return jsonify({
                "success": False,
                "message": "API key is required"
            }), 401
        
        # Validate API key
        if not wallet_api.validate_api_key(api_key):
            return jsonify({
                "success": False,
                "message": "Invalid API key"
            }), 401
        
        # Get subscription info
        subscription = wallet_api.get_subscription_info(api_key)
        if not subscription:
            return jsonify({
                "success": False,
                "message": "Could not retrieve subscription information"
            }), 400
        
        # Check if subscription is for Fragment API
        if subscription.get("selectedAPI") != "Fragment":
            return jsonify({
                "success": False,
                "message": "This API key is not authorized for Fragment API"
            }), 403
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400
        
        username = data.get("username")
        quantity = data.get("quantity", 50)
        
        if not username:
            return jsonify({
                "success": False,
                "message": "Username is required"
            }), 400
        
        if not isinstance(quantity, int) or quantity <= 0:
            return jsonify({
                "success": False,
                "message": "Quantity must be a positive integer"
            }), 400
        
        # Remove @ if present
        username = username.lstrip("@")
        
        # Buy stars
        import asyncio
        tx_hash = asyncio.run(wallet_api.stars_buy_service.buy_stars(
            user_id=subscription.get("selectedUser"),
            username=username,
            quantity=quantity
        ))
        
        if not tx_hash:
            return jsonify({
                "success": False,
                "message": "Failed to buy stars. Please check your wallet balance and Fragment credentials."
            }), 400
        
        return jsonify({
            "success": True,
            "message": "Stars purchased successfully",
            "data": {
                "username": username,
                "quantity": quantity,
                "tx_hash": tx_hash,
                "purchased_at": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error buying stars: {str(e)}"
        }), 500


@app.route('/wallet-balance', methods=['GET'])
def get_wallet_balance():
    """Get wallet balance for the authenticated user"""
    try:
        # Get API key from header
        api_key = request.headers.get(API_KEY_HEADER)
        if not api_key:
            return jsonify({
                "success": False,
                "message": "API key is required"
            }), 401
        
        # Validate API key
        if not wallet_api.validate_api_key(api_key):
            return jsonify({
                "success": False,
                "message": "Invalid API key"
            }), 401
        
        # Get subscription info
        subscription = wallet_api.get_subscription_info(api_key)
        if not subscription:
            return jsonify({
                "success": False,
                "message": "Could not retrieve subscription information"
            }), 400
        
        # Check if subscription is for Fragment API
        if subscription.get("selectedAPI") != "Fragment":
            return jsonify({
                "success": False,
                "message": "This API key is not authorized for Fragment API"
            }), 403
        
        # Get wallet balance
        import asyncio
        balance = asyncio.run(wallet_api.stars_buy_service.get_wallet_balance(
            user_id=subscription.get("selectedUser")
        ))
        
        if balance is None:
            return jsonify({
                "success": False,
                "message": "Failed to get wallet balance. Please check your wallet configuration."
            }), 400
        
        return jsonify({
            "success": True,
            "message": "Wallet balance retrieved successfully",
            "data": {
                "balance": balance,
                "balance_formatted": f"{balance / 1e9:.9f} TON",
                "retrieved_at": datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error getting wallet balance: {str(e)}"
        }), 500


@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        "success": True,
        "message": "Fragment Wallet & Stars API",
        "version": "1.0.0",
        "description": "Generate TON wallets and buy Telegram Stars with API key authentication",
        "endpoints": {
            "health": "GET /health",
            "generate_wallet": "POST /generate-wallet",
            "wallet_info": "GET /wallet-info",
            "search_user": "POST /search-user",
            "buy_stars": "POST /buy-stars",
            "wallet_balance": "GET /wallet-balance"
        },
        "authentication": {
            "header": "X-API-Key",
            "description": "Include your API key in the X-API-Key header"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3003))
    print(f"🐍 Fragment Python API running on port {port}")
    print(f"🔗 API available at http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True) 