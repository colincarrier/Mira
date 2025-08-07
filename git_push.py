#!/usr/bin/env python3
import subprocess
import os

# Set environment
token = os.environ.get('GITHUB_PERSONAL_ACCESS_TOKEN')
if not token:
    print("Token not found")
    exit(1)

commands = [
    ['git', 'add', '-A'],
    ['git', 'commit', '-m', 'Fix reconciliation report issues: empty payload guard, staleTime, and vite config'],
    ['git', 'push', f'https://colincarrier:{token}@github.com/colincarrier/Mira.git', 'main']
]

for cmd in commands:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"Command: {' '.join(cmd[:2] if 'push' in cmd[0] else cmd)}")
        print(f"Output: {result.stdout}")
        if result.stderr:
            print(f"Error: {result.stderr}")
    except Exception as e:
        print(f"Failed: {e}")