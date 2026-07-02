Instead of

fs.watch(...)

use

chokidar
Why?

fs.watch has known issues:

Misses rename events.
Can fire duplicate events.
Behaves differently on Windows/macOS/Linux.
Some editors save by creating a temporary file, which fs.watch doesn't always detect correctly.

chokidar is the industry standard for file watching and is much more reliable.

🔧 One more improvement

Instead of hardcoding

Notes/
    MAD2 (...)
    MLT (...)

scan the Notes and each week/ folder automatically.

Example:

Notes/

├── MAD2 (...)
├── MLT (...)
├── DBMS
├── Statistics
├── Java

The generator should automatically detect every course folder.

That way, in the future you can simply create

Notes/
    DBMS/

and it appears automatically.

🔧 Another small improvement

When generating config.js, store a little more metadata.

Instead of

{
    title,
    path
}

generate

{
    title,
    file,
    week,
    course,
    order
}

Later this enables:

Search
Recently opened
Breadcrumbs
Previous/Next
Progress tracking

without changing the generator.