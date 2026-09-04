import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error(`[${this.props.name || 'section'}]`, error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="banner warn" role="alert">
          <strong>{this.props.name || 'This section'} hit an unexpected error.</strong>{' '}
          <span className="mono">{String(this.state.error?.message || this.state.error)}</span>{' '}
          <button className="btn small" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
