// React
import React from "react";
import ReactDOM from "react-dom";

// Configuration
import { config } from "Conf/defaultOptions.js";

// Components
import App from "Components/app.js";
import ErrorBoundary from "Components/error.js";

export default function refreshApp() {
    // Re-build the application
    const element = (
        <ErrorBoundary>
            <App init={config.data} />
        </ErrorBoundary>
    );

    // Check to make sure target container is a DOM element
    var domElem = document.getElementById("ecease_start");
    if (domElem !== null) {
        ReactDOM.render(
            element,
            domElem
        );
    }
}