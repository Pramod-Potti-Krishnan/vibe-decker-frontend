#!/usr/bin/env python3
"""
Script to find all references to message.data pattern that need to be fixed.
This helps identify code still using the old structure where chat_data and slide_data
were wrapped in a 'data' field.
"""

import subprocess
import os
import sys

def run_search(pattern, description):
    """Run ripgrep search and format output"""
    print(f"\n{'='*60}")
    print(f"🔍 {description}")
    print('='*60)
    
    try:
        result = subprocess.run(
            ['rg', pattern, '--type', 'ts', '--type', 'js', '--glob', '!docs/**', '--glob', '!node_modules/**', '-n'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        
        if result.stdout:
            print(result.stdout)
            return True
        else:
            print("✅ No matches found!")
            return False
            
    except Exception as e:
        print(f"❌ Error running search: {e}")
        return False

def main():
    print("ROUND 14 FIX: Searching for old message.data pattern references")
    print("Looking for code that needs to be updated to access chat_data/slide_data directly")
    
    found_issues = False
    
    # Search patterns
    searches = [
        (r"message\.data\.", "Searching for 'message.data.' patterns"),
        (r"(data\.chat_data|data\.slide_data)", "Searching for 'data.chat_data' or 'data.slide_data'"),
        (r"const\s*{\s*data\s*}\s*=\s*message", "Searching for destructuring pattern '{ data } = message'"),
        (r"\.data\.(chat_data|slide_data)", "Searching for any '.data.chat_data' or '.data.slide_data'"),
        (r"message\.data\s*&&", "Searching for 'message.data &&' conditionals"),
        (r"!message\.data", "Searching for '!message.data' checks"),
    ]
    
    for pattern, description in searches:
        if run_search(pattern, description):
            found_issues = True
    
    print(f"\n{'='*60}")
    if found_issues:
        print("❗ FOUND ISSUES: Some code still references the old message.data structure")
        print("These files need to be updated to access chat_data/slide_data directly from the message")
    else:
        print("✅ ALL CLEAR: No references to old message.data structure found!")
    print('='*60)

if __name__ == "__main__":
    main()