# Virtual Media Folders

Virtual folder organization for the WordPress Media Library. Folders are a taxonomy overlay — files never move on disk and URLs never change.

## Language

**Folder**:
A single `vmfo_folder` taxonomy term that an attachment can belong to. Hierarchical (a folder has one parent) and each attachment belongs to at most one folder.
_Avoid_: Category, term, directory

**Uncategorized**:
The virtual bucket of attachments that have no `vmfo_folder` term. It is the *absence* of a folder, not a real term, so it cannot be targeted by a term-ID filter.
_Avoid_: Unassigned, none, root

**Folder order**:
The user-defined sibling ordering of folders, stored in the `vmfo_order` term meta and mirrored everywhere folders are listed (sidebar, taxonomy screen).
_Avoid_: Sort, position, weight

**Folder sidebar**:
The folder tree VMF injects into the classic `wp.media` modal (and the Media Library screen) by patching `AttachmentsBrowser`. Lets the user filter the grid by folder.
_Avoid_: Folder panel, tree view

**Inserter Media Category**:
One selectable source row in the block inserter's **Media** tab (peer of `Images` and `Openverse`), registered via `registerInserterMediaCategory`. Its only user input is a search box; it cannot render a custom tree. VMF registers one per top-level folder.
_Avoid_: Media source, media provider, inserter tab
