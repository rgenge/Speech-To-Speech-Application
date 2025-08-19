#!/usr/bin/env python3
"""
Simple WebSocket test script to verify the audio WebSocket endpoint is working.
Run this script after starting the Django development server.
"""

import asyncio
import websockets
import json
import sys

async def test_websocket():
    uri = "ws://localhost:8000/ws/audio/"
    
    try:
        print("🔌 Attempting to connect to WebSocket...")
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connection established!")
            
            # Send a test message
            test_message = {
                "type": "start_recording",
                "timestamp": 1234567890
            }
            
            await websocket.send(json.dumps(test_message))
            print(f"📤 Sent: {test_message}")
            
            # Wait for response
            response = await websocket.recv()
            response_data = json.loads(response)
            print(f"📥 Received: {response_data}")
            
            # Send stop recording message
            stop_message = {
                "type": "stop_recording",
                "timestamp": 1234567890
            }
            
            await websocket.send(json.dumps(stop_message))
            print(f"📤 Sent: {stop_message}")
            
            # Wait for response
            response = await websocket.recv()
            response_data = json.loads(response)
            print(f"📥 Received: {response_data}")
            
            print("✅ WebSocket test completed successfully!")
            
    except websockets.exceptions.ConnectionRefusedError:
        print("❌ Connection refused. Make sure Django server is running at localhost:8000")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🧪 Testing WebSocket connection...")
    asyncio.run(test_websocket())
