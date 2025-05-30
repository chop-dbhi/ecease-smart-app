import React from "react";
import PropTypes from 'prop-types';

// Common
import { log } from "Shared/log.js";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        log(error.message + " " + errorInfo.componentStack, "error");
    }

    render() {
        if (this.state.hasError) {
            var errorMessage = [
                "An error occurred while loading the eCEASE Tool.",
                "Application developers have been notified and are working to correct the issue."
            ].join(" ");
            // You can render any custom fallback UI
            return <p>{errorMessage}</p>;
        }

        return this.props.children; 
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.element
};

export default ErrorBoundary;