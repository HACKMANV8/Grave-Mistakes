"""
Quick test script to verify backend models are working
"""

import sys
import os

# Add the server directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Testing VynceAI Backend Models...")
print("=" * 50)

try:
    # Test importing schemas
    print("\n1. Testing schema imports...")
    from app.models.schemas import (
        AIRequest, 
        AIResponse, 
        PageContext,
        MemoryItem,
        CommandRequest,
        CommandResponse,
        HealthResponse,
        ErrorResponse
    )
    print("✓ All schemas imported successfully")
    
    # Test creating PageContext
    print("\n2. Testing PageContext model...")
    context = PageContext(
        url="https://example.com",
        title="Test Page",
        selectedText="Some text",
        pageContent="Page content here"
    )
    print(f"✓ PageContext created: {context.url}")
    
    # Test creating AIRequest with context
    print("\n3. Testing AIRequest with PageContext...")
    ai_request = AIRequest(
        prompt="What is this page about?",
        context=context,
        model="gemini-2.5-flash"
    )
    print(f"✓ AIRequest created with context: {ai_request.prompt[:30]}...")
    
    # Test creating AIRequest with dict context (camelCase)
    print("\n4. Testing AIRequest with dict context (camelCase)...")
    ai_request_dict = AIRequest(
        prompt="What is this page about?",
        context={
            "url": "https://example.com",
            "title": "Test Page",
            "selectedText": "Some text",
            "pageContent": "Page content here"
        },
        model="gemini-2.5-flash"
    )
    print(f"✓ AIRequest created with dict context")
    
    # Test MemoryItem
    print("\n5. Testing MemoryItem...")
    memory = MemoryItem(
        user="Hello",
        bot="Hi there!",
        timestamp="2025-10-31T12:00:00"
    )
    print(f"✓ MemoryItem created: {memory.user}")
    
    # Test AIRequest with memory
    print("\n6. Testing AIRequest with memory...")
    ai_request_memory = AIRequest(
        prompt="Continue our conversation",
        memory=[memory],
        model="gemini-2.5-flash"
    )
    print(f"✓ AIRequest created with {len(ai_request_memory.memory)} memory items")
    
    # Test AIResponse
    print("\n7. Testing AIResponse...")
    ai_response = AIResponse(
        response="This is a test response",
        model="gemini-2.5-flash",
        tokens=10,
        success=True
    )
    print(f"✓ AIResponse created: {ai_response.response[:30]}...")
    
    # Test CommandRequest
    print("\n8. Testing CommandRequest...")
    cmd_request = CommandRequest(
        command="test_command",
        params={"key": "value"}
    )
    print(f"✓ CommandRequest created: {cmd_request.command}")
    
    # Test CommandResponse
    print("\n9. Testing CommandResponse...")
    cmd_response = CommandResponse(
        result="Command executed successfully",
        success=True
    )
    print(f"✓ CommandResponse created")
    
    # Test HealthResponse
    print("\n10. Testing HealthResponse...")
    health = HealthResponse(
        status="ok",
        service="VynceAI",
        uptime="5m 30s",
        version="1.0.0"
    )
    print(f"✓ HealthResponse created: {health.status}")
    
    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED!")
    print("=" * 50)
    print("\nThe backend models are working correctly.")
    print("You can now start the server with: python main.py")
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
