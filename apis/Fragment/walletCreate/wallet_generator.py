import tqdm
from tonsdk.contract.wallet import Wallets, WalletVersionEnum
import json
from datetime import datetime

class WalletGenerator:
    def __init__(self):
        self.output_file = "wallets.txt"
    
    def generate_single_wallet(self):
        """Generate a single wallet and return wallet data"""
        try:
            # Generate wallet using tonsdk
            mnemonics, pub_k, priv_k, wallet = Wallets.create(WalletVersionEnum.v4r2, workchain=0)
            wallet_address = wallet.address.to_string(True, True, False)
            
            # Create wallet data structure
            wallet_data = {
                "address": wallet_address,
                "mnemonics": mnemonics,
                "public_key": pub_k.hex() if hasattr(pub_k, 'hex') else str(pub_k),
                "private_key": priv_k.hex() if hasattr(priv_k, 'hex') else str(priv_k),
                "workchain": 0,
                "version": "v4r2",
                "generated_at": datetime.now().isoformat()
            }
            
            return wallet_data
            
        except Exception as e:
            raise Exception(f"Error generating wallet: {str(e)}")
    
    def generate_multiple_wallets(self, count):
        """Generate multiple wallets and return list of wallet data"""
        try:
            wallets = []
            
            for i in tqdm.tqdm(range(count), desc="Generating wallets"):
                wallet_data = self.generate_single_wallet()
                wallets.append(wallet_data)
            
            return wallets
            
        except Exception as e:
            raise Exception(f"Error generating multiple wallets: {str(e)}")
    
    def generate_wallets_to_file(self, count, filename=None):
        """Generate wallets and save to file (legacy method)"""
        try:
            if filename:
                output_file = filename
            else:
                output_file = self.output_file
            
            output = ""
            wallets = []
            
            for i in tqdm.tqdm(range(count), desc="Generating wallets"):
                # Generate wallet
                mnemonics, pub_k, priv_k, wallet = Wallets.create(WalletVersionEnum.v4r2, workchain=0)
                wallet_address = wallet.address.to_string(True, True, False)
                
                # Add to output string
                output += "\n\n" + wallet_address + "\n" + ' '.join(mnemonics) + "\n"
                
                # Add to wallets list
                wallet_data = {
                    "address": wallet_address,
                    "mnemonics": mnemonics,
                    "public_key": pub_k.hex() if hasattr(pub_k, 'hex') else str(pub_k),
                    "private_key": priv_k.hex() if hasattr(priv_k, 'hex') else str(priv_k),
                    "workchain": 0,
                    "version": "v4r2",
                    "generated_at": datetime.now().isoformat()
                }
                wallets.append(wallet_data)
            
            # Save to file
            with open(output_file, "a") as f:
                f.write(output)
            
            return wallets
            
        except Exception as e:
            raise Exception(f"Error generating wallets to file: {str(e)}")
    
    def generate_wallets_json(self, count):
        """Generate wallets and return as JSON string"""
        try:
            wallets = self.generate_multiple_wallets(count)
            
            # Create JSON structure
            json_data = {
                "generated_at": datetime.now().isoformat(),
                "count": count,
                "wallets": wallets
            }
            
            return json.dumps(json_data, indent=2)
            
        except Exception as e:
            raise Exception(f"Error generating wallets JSON: {str(e)}")
    
    def save_wallets_to_json_file(self, count, filename="wallets.json"):
        """Generate wallets and save to JSON file"""
        try:
            json_data = self.generate_wallets_json(count)
            
            with open(filename, "w") as f:
                f.write(json_data)
            
            return filename
            
        except Exception as e:
            raise Exception(f"Error saving wallets to JSON file: {str(e)}")

# Legacy function for backward compatibility
def generate_wallets(count):
    """Legacy function to generate wallets and save to file"""
    generator = WalletGenerator()
    return generator.generate_wallets_to_file(count)

# Main script for standalone execution
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════════════════════════╗
    ║                    TON Wallet Generator                      ║
    ║                                                              ║
    ║  This script generates TON wallets with mnemonic phrases.   ║
    ║  Generated wallets will be saved to 'wallets.txt' file.     ║
    ╚══════════════════════════════════════════════════════════════╝
    """)
    
    try:
        # Get count from user input
        count = int(input("Enter number of wallets to generate: "))
        
        if count <= 0:
            print("❌ Please enter a positive number.")
            exit(1)
        
        if count > 1000:
            print("⚠️  Warning: Generating more than 1000 wallets may take a while.")
            confirm = input("Continue? (y/N): ")
            if confirm.lower() != 'y':
                print("❌ Operation cancelled.")
                exit(1)
        
        # Generate wallets
        generator = WalletGenerator()
        wallets = generator.generate_wallets_to_file(count)
        
        print(f"\n✅ Successfully generated {count} wallets!")
        print(f"📁 Wallets saved to: {generator.output_file}")
        print(f"📊 Generated {len(wallets)} wallet(s)")
        
        # Show first wallet as example
        if wallets:
            print(f"\n📋 Example wallet:")
            print(f"   Address: {wallets[0]['address']}")
            print(f"   Mnemonics: {' '.join(wallets[0]['mnemonics'])}")
        
    except ValueError:
        print("❌ Please enter a valid number.")
    except KeyboardInterrupt:
        print("\n❌ Operation cancelled by user.")
    except Exception as e:
        print(f"❌ Error: {str(e)}") 