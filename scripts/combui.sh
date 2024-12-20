#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

combine_md ./chat-ui/src '*.*' combined_ui.md
echo "Combined ui source files: combined_ui.md"
