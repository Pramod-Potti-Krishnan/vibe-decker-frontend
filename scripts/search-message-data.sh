#!/bin/bash

echo "Searching for message.data patterns in TypeScript/JavaScript files..."
echo "========================================================"

# Search for message.data patterns
echo -e "\n1. Searching for 'message.data' patterns:"
rg -t ts -t tsx -t js -t jsx "message\.data\." --glob '!docs/**' --glob '!node_modules/**' -n

echo -e "\n2. Searching for 'data.chat_data' or 'data.slide_data':"
rg -t ts -t tsx -t js -t jsx "(data\.chat_data|data\.slide_data)" --glob '!docs/**' --glob '!node_modules/**' -n

echo -e "\n3. Searching for destructuring pattern '{ data }':"
rg -t ts -t tsx -t js -t jsx "const\s*{\s*data\s*}\s*=\s*message" --glob '!docs/**' --glob '!node_modules/**' -n

echo -e "\nSearch complete!"