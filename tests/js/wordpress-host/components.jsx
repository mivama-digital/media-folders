import React, { Fragment } from 'react';

export const Button = React.forwardRef(function Button(
	{
		children,
		icon,
		label,
		variant,
		isDestructive,
		isBusy,
		isPressed,
		showTooltip,
		accessibleWhenDisabled,
		shortcut,
		__next40pxDefaultSize,
		...props
	},
	ref
) {
	return (
		<button ref={ref} type={props.type ?? 'button'} {...props}>
			{children ?? label ?? (typeof icon === 'string' ? icon : null)}
		</button>
	);
});

export function Notice({ children, status, onRemove, ...props }) {
	return (
		<div role="status" data-status={status} {...props}>
			{children}
			{onRemove ? <button type="button" onClick={onRemove}>Dismiss</button> : null}
		</div>
	);
}

export function Modal({ children, title, onRequestClose, ...props }) {
	return (
		<div role="dialog" aria-label={title} {...props}>
			{children}
			{onRequestClose ? <button type="button" onClick={onRequestClose}>Close</button> : null}
		</div>
	);
}

export const TextControl = React.forwardRef(function TextControl(
	{ label, value = '', onChange = () => {}, ...props },
	ref
) {
	return (
		<label>
			{label}
			<input ref={ref} value={value} onChange={(event) => onChange(event.target.value)} {...props} />
		</label>
	);
});

export const SelectControl = React.forwardRef(function SelectControl(
	{ label, value = '', options = [], onChange = () => {}, ...props },
	ref
) {
	return (
		<label>
			{label}
			<select ref={ref} value={value} onChange={(event) => onChange(event.target.value)} {...props}>
				{options.map((option) => (
					<option key={String(option.value)} value={option.value} disabled={option.disabled}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
});

export function Dropdown({ renderToggle, renderContent }) {
	const close = () => {};
	return (
		<>
			{renderToggle?.({ isOpen: true, onToggle: () => {}, onClose: close })}
			{renderContent?.({ onClose: close })}
		</>
	);
}

export function MenuGroup({ children, label }) {
	return <div aria-label={label}>{children}</div>;
}

export function MenuItem({ children, onClick, ...props }) {
	return <button type="button" onClick={onClick} {...props}>{children}</button>;
}

export function Spinner() {
	return <span role="status">Loading</span>;
}

export function SlotFillProvider({ children }) {
	return <Fragment>{children}</Fragment>;
}

export function Popover({ children }) {
	return <Fragment>{children}</Fragment>;
}

Popover.Slot = function PopoverSlot({ children }) {
	return <Fragment>{children}</Fragment>;
};
