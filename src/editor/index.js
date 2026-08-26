/**
 * Gutenberg Editor Integration for Virtual Media Folders.
 *
 * Entry point for block editor integration, including:
 * - Media library folder filtering via sidebar
 * - Enhanced MediaUpload component
 */

import { createRoot, createElement } from '@wordpress/element';
import FolderSidebar from './components/FolderSidebar.jsx';
import { registerFolderInserterCategories } from './inserter-media-categories';
import './styles/editor.css';

/**
 * Initialize Gutenberg integration.
 */
function initGutenbergIntegration() {
	// Wait for wp.media to be fully available
	if (!window.wp?.media?.view?.AttachmentsBrowser) {
		// Retry after a short delay
		setTimeout(initGutenbergIntegration, 100);
		return;
	}

	// Extend AttachmentsBrowser to add folder sidebar in block editor media modals
	const originalRender = wp.media.view.AttachmentsBrowser.prototype.render;

	wp.media.view.AttachmentsBrowser.prototype.render = function () {
		originalRender.apply(this, arguments);

		const mediaState = this.controller?.state?.();
		const mediaStateId = mediaState?.id || mediaState?.get?.('id');
		if (mediaStateId === 'gallery-edit') {
			return this;
		}

		// Only add sidebar if not already present
		if (!this.$el.find('.vmf-editor-folder-sidebar').length) {
			// Only inject once the grid has rendered.
			const $attachmentsWrapper = this.$el.find('.attachments-wrapper').first();
			const $attachments = this.$el.find('.attachments').first();
			
			if ($attachmentsWrapper.length || $attachments.length) {
				const sidebarContainer = document.createElement('div');
				sidebarContainer.className = 'vmf-editor-folder-sidebar';
				
				// Attach to .attachments-browser (this.$el) so the sidebar is
				// positioned in the same coordinate space as core's scroll box,
				// whether or not "load more" wraps the grid.
				this.$el.prepend(sidebarContainer);

				const collection = this.collection;
				const browser = this;

				const root = createRoot(sidebarContainer);
				root.render(
					createElement(FolderSidebar, {
						onFolderSelect: (folderId) => {
							if (!collection) return;

							// Add loading state
							const $attachmentsEl = browser.$el.find('.attachments');
							$attachmentsEl.addClass('vmf-loading');
							
							// Hide/show uploader based on folder selection
							if (folderId !== null) {
								browser.$el.addClass('vmf-folder-filtered');
							} else {
								browser.$el.removeClass('vmf-folder-filtered');
							}

							// Reset existing filters
							collection.props.unset('vmfo_folder');
							collection.props.unset('vmfo_folder_exclude');

							if (folderId === 'uncategorized') {
								collection.props.set({ vmfo_folder_exclude: 'all' });
							} else if (folderId && folderId !== '') {
								collection.props.set({ vmfo_folder: parseInt(folderId, 10) });
							}
							// null = All Media, no filter needed
							
							// Refresh the collection
							collection.reset();
							collection.more({ remove: false }).then(() => {
								$attachmentsEl.removeClass('vmf-loading');
							}).catch(() => {
								$attachmentsEl.removeClass('vmf-loading');
							});
						},
					})
				);
				
				// Add class to browser for CSS styling
				this.$el.addClass('vmf-has-folder-sidebar');
			}
		}

		return this;
	};
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initGutenbergIntegration);
} else {
	initGutenbergIntegration();
}

// Register block-inserter Media tab categories (one per top-level folder).
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', registerFolderInserterCategories);
} else {
	registerFolderInserterCategories();
}

export { initGutenbergIntegration };
