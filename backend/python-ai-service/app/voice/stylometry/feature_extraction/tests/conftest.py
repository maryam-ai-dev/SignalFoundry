"""
Pytest configuration for the feature_extraction test suite.

Adds the repository root to sys.path so that ``import feature_extraction``
works regardless of how pytest is invoked (e.g., from the repo root vs.
from the tests/ directory).
"""

import sys
from pathlib import Path

# Go up two levels: tests/ -> feature_extraction/ -> repo root
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
