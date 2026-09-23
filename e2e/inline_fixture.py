"""Loads the actual standalone production export for restricted-browser visual audits.
The optional controlled-test mode enables only the existing diagnostic seam; no
simulation, interaction, art, audio or scoring code is replaced.
This does NOT test HTTP ES-module loading or the macOS file-open workflow.
"""
from pathlib import Path
import re

def inline_fixture(root:Path,diagnostics=True)->str:
    html=(root/'PLAY.html').read_text()
    if diagnostics:
        html=re.sub(r"(?m)^\s*if\(!\['localhost'.*?\)return;",'  // Explicit controlled browser audit: diagnostics enabled.',html)
    return html
