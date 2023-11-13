import { instanceOfKENGINEElement } from "../KENGINEElement.js";

type ResizeObserverCallback = () => Promise<void> | void;

let resizeObserver: ResizeObserver;
const observedElements = new Map<HTMLElement, Array<ResizeObserverCallback>>();

const getResizeObserver = () => {
	if (!resizeObserver) {
		resizeObserver = new window.ResizeObserver(entries => {
			window.requestAnimationFrame(() => {
				entries.forEach(entry => {
					const callbacks = observedElements.get(entry.target as HTMLElement);
					// Callbacks could be async and we need to handle returned promises to comply with the eslint "no-misused-promises" rule.
					// Although Promise.all awaits all, we don't await the additional task after calling the callbacks and should not make any difference.
					callbacks && Promise.all(callbacks.map((callback: ResizeObserverCallback) => callback()));
				});
			});
		});
	}
	return resizeObserver;
};

const observe = (element: HTMLElement, callback: ResizeObserverCallback) => {
	const callbacks = observedElements.get(element) || [];

	// if no callbacks have been added for this element - start observing it
	if (!callbacks.length) {
		getResizeObserver().observe(element);
	}

	// save the callbacks in an array
	observedElements.set(element, [...callbacks, callback]);
};

const unobserve = (element: HTMLElement, callback: ResizeObserverCallback) => {
	const callbacks = observedElements.get(element) || [];
	if (callbacks.length === 0) {
		return;
	}

	const filteredCallbacks = callbacks.filter((fn: ResizeObserverCallback) => fn !== callback);
	if (filteredCallbacks.length === 0) {
		getResizeObserver().unobserve(element);
		observedElements.delete(element);
	} else {
		observedElements.set(element, filteredCallbacks);
	}
};

/**
 * Allows to register/deregister resize observers for a DOM element
 *
 * @public
 * @class
  */
class ResizeHandler {
	/**
	 * @static
	 * @public
	 * @param {*} element KENGINE Web Component or DOM Element to be observed
	 * @param {*} callback Callback to be executed
	 */
	static register(element: HTMLElement, callback: ResizeObserverCallback) {
		let effectiveElement: HTMLElement | undefined = element;

		if (instanceOfKENGINEElement(effectiveElement)) {
			effectiveElement = effectiveElement.getDomRef();
		}

		if (effectiveElement instanceof HTMLElement) {
			observe(effectiveElement, callback);
		} else {
			console.warn("Cannot register ResizeHandler for element", element); // eslint-disable-line
		}
	}

	/**
	 * @static
	 * @public
	 * @param {*} element KENGINE Web Component or DOM Element to be unobserved
	 * @param {*} callback Callback to be removed
	 */
	static deregister(element: HTMLElement, callback: ResizeObserverCallback) {
		let effectiveElement: HTMLElement | undefined = element;

		if (instanceOfKENGINEElement(effectiveElement)) {
			effectiveElement = effectiveElement.getDomRef();
		}

		if (effectiveElement instanceof HTMLElement) {
			unobserve(effectiveElement, callback);
		} else {
			console.warn("Cannot deregister ResizeHandler for element", element); // eslint-disable-line
		}
	}
}

export default ResizeHandler;
export type {
	ResizeObserverCallback,
};
