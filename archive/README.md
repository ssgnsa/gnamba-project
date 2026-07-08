# Archive directory

This folder is intended to contain legacy artifacts moved out of the main release tree.

Guidance:

- Do not keep runtime or production code in `supabase/` inside the release image.
- When ready, move `supabase/` to `archive/supabase/` using `git mv` to preserve history.
- Before moving, ensure any required migrations or functions are ported to the canonical backend (FastAPI) or to a separate repository.

Example:

git mv supabase archive/supabase
git commit -m "archive: move legacy supabase artifacts out of main tree"
