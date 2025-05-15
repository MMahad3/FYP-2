import requests
import socket
import os

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def test_server():
    local_ip = get_ip()
    print(f"\nServer Information:")
    print(f"Local IP Address: {local_ip}")
    print(f"Server URL: http://{local_ip}:5000")
    print("\nTesting server endpoints...")

    try:
        # Test health endpoint
        response = requests.get('http://127.0.0.1:5000/health')
        if response.status_code == 200:
            print("✓ Health check endpoint is working")
        else:
            print("✗ Health check endpoint failed")
    except Exception as e:
        print(f"✗ Could not connect to server: {str(e)}")
        return

    # Check if uploads directory exists
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
        print("✓ Created uploads directory")
    else:
        print("✓ Uploads directory exists")

    print("\nServer is ready for connections!")
    print("\nTo use with the React Native app:")
    print(f"1. Update API_URL in HomeScreen.tsx to: http://{local_ip}:5000")
    print("2. Make sure your mobile device is on the same WiFi network")
    print("3. Try uploading a video or image from the app")

if __name__ == "__main__":
    test_server() 