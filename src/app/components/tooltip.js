import Tippy from '@tippyjs/react/headless';

// Shared
import { log } from "Shared/log.js";

// Set TippyJS tooltip defaults
Tippy.defaultProps = {
    delay: [250, 250],
    interactive: true,
    offset: [0, 15]
};

var tippyInstances = [];
const tippyStore = {
    fn(instance) {
        return {
            onCreate() {
                // Change tooltip shell id to ensure we don't clash with EHR elements
                instance.popper.id = "ecease_tooltip_" + instance.id;
                // Add the instance to a global instance tracker
                tippyInstances.push(instance);
            },
            onTrigger() {
                // Check if other tooltips are visible and hide them
                var visible = false;
                tippyInstances.forEach((i) => {
                    if (instance.id != i.id) {
                        if (i.state.isVisible) {
                            visible = true;
                        }
                        i.hide();
                    }
                });
                if (visible) {
                    // Quickly navigate between the tooltips so they act like a "group"
                    instance.setProps({delay: 0});
                }
            },
            onMount() {
                log("Hover event on " + instance.popper.firstChild.id, "info");
                // Reset the default delay property
                instance.setProps({delay: Tippy.defaultProps.delay});
            },
            onDestroy() {
                // Remove instances from global store
                tippyInstances = tippyInstances.filter((i) => i !== instance);
            },
        };
    },
};

export {
    tippyStore
};