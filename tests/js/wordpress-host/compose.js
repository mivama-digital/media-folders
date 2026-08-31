export function createHigherOrderComponent(mapComponent) {
	return (OriginalComponent) => mapComponent(OriginalComponent);
}

export function compose(...functions) {
	return (value) => functions.reduceRight((current, fn) => fn(current), value);
}
