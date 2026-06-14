/**
 * Gutenberg editor integration tests.
 *
 * @package VirtualMediaFolders
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from '@wordpress/element';

vi.mock('@wordpress/element', () => ({
	createElement: vi.fn((component, props) => ({ component, props })),
	createRoot: vi.fn(() => ({
		render: vi.fn(),
	})),
}));

vi.mock('../../../src/editor/components/FolderSidebar.jsx', () => ({
	default: () => null,
}));

function createJQueryElement(overrides = {}) {
	return {
		0: document.createElement('div'),
		length: 0,
		first: vi.fn(function () {
			return this;
		}),
		prepend: vi.fn(),
		before: vi.fn(),
		addClass: vi.fn(),
		removeClass: vi.fn(),
		...overrides,
	};
}

function createBrowser(stateId) {
	const attachmentsWrapper = createJQueryElement({ length: 1 });
	const attachments = createJQueryElement({ length: 1 });
	const find = vi.fn((selector) => {
		if (selector === '.vmf-editor-folder-sidebar') {
			return createJQueryElement();
		}
		if (selector === '.attachments-wrapper') {
			return attachmentsWrapper;
		}
		if (selector === '.attachments') {
			return attachments;
		}
		return createJQueryElement();
	});

	return {
		controller: {
			state: vi.fn(() => ({ id: stateId })),
		},
		$el: {
			find,
			addClass: vi.fn(),
			removeClass: vi.fn(),
		},
		collection: {
			props: {
				unset: vi.fn(),
				set: vi.fn(),
			},
			reset: vi.fn(),
			more: vi.fn(() => Promise.resolve()),
		},
		attachmentsWrapper,
		attachments,
	};
}

async function loadIntegration(originalRender = vi.fn()) {
	vi.resetModules();
	window.wp = {
		media: {
			view: {
				AttachmentsBrowser: function AttachmentsBrowser() {},
			},
		},
	};
	window.wp.media.view.AttachmentsBrowser.prototype.render = originalRender;

	return import('../../../src/editor/index.js');
}

describe('Gutenberg editor integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		delete window.wp;
	});

	it('does not inject the VMFO sidebar while editing a gallery', async () => {
		const originalRender = vi.fn();
		await loadIntegration(originalRender);

		const browser = createBrowser('gallery-edit');
		const result = window.wp.media.view.AttachmentsBrowser.prototype.render.call(browser);

		expect(result).toBe(browser);
		expect(originalRender).toHaveBeenCalledOnce();
		expect(browser.$el.find).not.toHaveBeenCalledWith('.vmf-editor-folder-sidebar');
		expect(createRoot).not.toHaveBeenCalled();
	});

	it('still injects the VMFO sidebar in normal media library states', async () => {
		await loadIntegration();

		const browser = createBrowser('insert');
		const result = window.wp.media.view.AttachmentsBrowser.prototype.render.call(browser);

		expect(result).toBe(browser);
		expect(browser.$el.find).toHaveBeenCalledWith('.vmf-editor-folder-sidebar');
		expect(browser.attachmentsWrapper.prepend).toHaveBeenCalledWith(expect.any(HTMLDivElement));
		expect(browser.$el.addClass).toHaveBeenCalledWith('vmf-has-folder-sidebar');
		expect(createRoot).toHaveBeenCalledOnce();
	});
});